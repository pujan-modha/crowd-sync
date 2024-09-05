"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOutIcon, PlusIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";
import dynamic from "next/dynamic";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { databases, account, DATABASE_ID, COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useEffect } from "react";
import { AppwriteException } from "appwrite";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
} from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faCommentAlt, faFlag, faUser } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const ClientSideMap = dynamic(() => import('@/components/ClientSideMap'), {
  ssr: false,
});

export default function Home() {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(10)]
      );
      const parsedReports = response.documents.map((doc) => ({
        ...doc,
        localities: doc.localities.map((localityString) =>
          JSON.parse(localityString)
        ),
      }));
      setReports(parsedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({ title: "Error fetching reports", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const ReportForm = () => {
    const [type, setType] = useState("");
    const [subtype, setSubtype] = useState("");
    const [severity, setSeverity] = useState("");
    const [pincode, setPincode] = useState("");
    const [fetchedLocalities, setFetchedLocalities] = useState([]);
    const [localities, setLocalities] = useState<
      { name: string; coords: [number, number] }[]
    >([]);
    const [pincode_error, setPincodeError] = useState(null);
    const [description, setDescription] = useState("");

    const options = {
      method: "GET",
      url: `https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/${pincode}`,
      headers: {
        "x-rapidapi-key": "756493b2cfmsh2115bf55dcb256bp10e017jsn0d50ad02fbe9",
        "x-rapidapi-host":
          "india-pincode-with-latitude-and-longitude.p.rapidapi.com",
      },
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) {
        toast({
          title: "Please log in to submit a report",
          variant: "destructive",
        });
        return;
      }

      try {
        // Refresh session
        await account.getSession("current");

        // Convert each locality object to a string
        const localitiesAsStrings = localities.map((locality) =>
          JSON.stringify(locality)
        );

        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          "unique()",
          {
            type,
            subtype,
            severity,
            pincode,
            localities: localitiesAsStrings, // Send array of strings
            description,
            user_id: user.$id,
          }
        );
        console.log("Document created successfully:", response);
        toast({ title: "Report submitted successfully!" });

        // Refresh the feed
        await fetchReports();

        // Clear the form
        setType("");
        setSubtype("");
        setSeverity("");
        setPincode("");
        setLocalities([]);
        setDescription("");

        // Close the dialog
        setDialogOpen(false);
      } catch (error) {
        console.error("Error submitting report:", error);
        if (error instanceof AppwriteException) {
          toast({
            title: "Error submitting report",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      }
    };

    const handleSearchPincode = async () => {
      try {
        const res = await axios.request(options);
        console.log(res.data);
        if (res.data.length == 0) {
          throw "Pincode invalid!";
        }
        setFetchedLocalities(res.data);
      } catch (error) {
        console.log(error);
        setPincodeError(error);
      }
    };

    useEffect(() => {
      console.log(localities);
    }, [localities]);

    useEffect(() => {
      if (pincode.length == 6) {
        handleSearchPincode();
      } else {
        setFetchedLocalities([]);
      }
    }, [pincode]);

    const handlePincodeChange = (e) => {
      if (e.target.value.length <= 6) {
        setPincode(e.target.value);
      }
    };

    const handleGetCurrentLocation = () => {
      if (typeof window !== 'undefined') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(latitude, longitude);

            // Add the current location to the localities array
            setLocalities((prev) => [
              ...prev,
              { name: "Current Location", coords: [latitude, longitude] },
            ]);
          },
          (error) => {
            console.log(error);
          }
        );
      }
    };

    return (
      <div className="">
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup
            value={type}
            onValueChange={setType}
            className="grid grid-cols-2 gap-2"
            required
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Hazard" id="hazard" />
              <Label htmlFor="hazard">Hazard</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Disaster" id="disaster" />
              <Label htmlFor="disaster">Disaster</Label>
            </div>
          </RadioGroup>
          <Select value={subtype} onValueChange={setSubtype}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {type === "Hazard" ? (
                <>
                  <SelectItem value="car_accident">Car Accident</SelectItem>
                  <SelectItem value="tree_fallen">Tree Fallen</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="chemical_spill">Chemical Spill</SelectItem>
                  <SelectItem value="gas_leak">Gas Leak</SelectItem>
                  <SelectItem value="electrical_fire">Electrical Fire</SelectItem>
                  <SelectItem value="building_collapse">Building Collapse</SelectItem>
                  <SelectItem value="bridge_collapse">Bridge Collapse</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  {/* Add more hazard types */}
                </>
              ) : (
                <>
                  <SelectItem value="dam_break">Dam Break</SelectItem>
                  <SelectItem value="tsunami">Tsunami</SelectItem>
                  <SelectItem value="volcano_eruption">Volcano Eruption</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="tornado">Tornado</SelectItem>
                  <SelectItem value="wildfire">Wildfire</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  {/* Add more disaster types */}
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            max={999999}
            placeholder="Pincode"
            value={pincode}
            onChange={handlePincodeChange}
          />
          {pincode_error && <p className="text-red-600">{pincode_error}</p>}
          {/* <Button type="button" onClick={() => handleSearchPincode()}>
          Search your area
        </Button> */}

          {/* Add checkbox list for localities based on pincode */}
          {/* This is a placeholder, you'll need to implement locality fetching based on pincode */}
          <div className="flex flex-wrap gap-2 items-center">
            {fetchedLocalities.map((location, index) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox
                  id={`locality${index}`}
                  onCheckedChange={(checked) =>
                    setLocalities((prev) => {
                      const updatedLocalities = checked
                        ? [
                            ...prev,
                            {
                              name: location.area,
                              coords: [location.lat, location.lng],
                            },
                          ]
                        : prev.filter((l) => l.name !== location.area);
                      return updatedLocalities;
                    })
                  }
                />
                <Label htmlFor={`locality${index}`}>{location.area}</Label>
              </div>
            ))}
            {type === "Hazard" && (
              <Button type="button" onClick={handleGetCurrentLocation}>
                Add current location
              </Button>
            )}
          </div>

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button type="submit">Submit Report</Button>
        </form>
      </div>
    );
  };

  const ReportCard = ({ report }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleFlagConfirm = () => {
      // Here you would implement the actual flagging logic
      console.log("Report flagged:", report.$id);
      setDialogOpen(false);
    };

    return (
      <div className="bg-white border border-foreground/10 shadow rounded-lg p-4 mb-4 font-[family-name:var(--font-geist-sans)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FontAwesomeIcon
              icon={faUser}
              className="w-6 h-6 mr-2 rounded-full bg-primary/10 p-2 text-foreground"
            />
            <div className="my-auto">
              <p>
                {user.email
                  ? `${user.name} ${user.email.split("@")[0]}`
                  : "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.$createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <FontAwesomeIcon
                  icon={faFlag}
                  className="w-4 h-4 rounded-full p-2 text-red-400/70"
                />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Flag this report?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <div className="mx-auto">
                  <Button onClick={handleFlagConfirm} className="w-full">Confirm</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg capitalize">
            {report.type} - {report.subtype}
          </h3>
          <Badge
            className={clsx(
              `text-sm leading-none py-0.5 px-2`,
              report.severity === "low"
                ? "bg-green-500/10 border-green-500 text-green-500"
                : report.severity === "medium"
                ? "bg-orange-500/10 border-orange-500 text-orange-500"
                : "bg-red-500/10 border-red-500 text-red-500"
            )}
          >
            {report.severity === "low"
              ? "Low"
              : report.severity === "medium"
              ? "Medium"
              : "High"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {report.localities.map((local, index) => (
            <span key={index}>
              {local.name}
              {index < report.localities.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
        <p className="mt-2">{report.description}</p>

        <ClientSideMap report={report} />
        <div className="flex w-full mt-2">
          <Button size="sm">Report same issue</Button>
          <Button size="icon" variant="ghost" className="ml-auto">
            <FontAwesomeIcon icon={faCommentAlt} className="w-6 h-6 text-foreground/70"/>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background font-[font-family:var(--font-geist-sans)] w-md mx-auto">
      <nav className="px-4 sticky flex items-center justify-between top-0 z-50 h-16 w-full bg-background border-b-2 border-primary/10">
        <div className="text-xl font-bold text-foreground">CrowdSync</div>
        <div className="flex items-center gap-2">
          {user && (
            <Button size="sm" onClick={logout} variant="default" className="text-foreground">
              <LogOutIcon className="h-4 w-4 mr-1" />
              <span className="leading-none">Logout</span>
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                <span className="leading-none">Report</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogTitle>Report a Disaster/Hazard</DialogTitle>
              {user ? <ReportForm /> : <Auth />}
            </DialogContent>
          </Dialog>
        </div>
      </nav>
      <main>
        <ScrollArea className="min-h-[calc(100vh-128px)] h-full px-4 py-2">
          <div>
            {user ? (
              <>
                {/* <div className="flex justify-between items-center mb-4">
                  <p className="text-lg">
                    Welcome,{" "}
                    {user.email
                      ? `${user.name} ${user.email.split("@")[0]}`
                      : "User"}
                    !
                  </p>
                </div> */}
                <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
                {reports.map((report) => (
                  <ReportCard key={report.$id} report={report} />
                ))}
              </>
            ) : (
              <p className="text-lg text-center">
                Please log in to view and submit reports.
              </p>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t-2 border-foreground/10 bg-background">
        <div className="container flex h-16 items-center justify-center">
          <p className="text-sm text-primary/70">
            CrowdSync is a crowdsourced disaster reporting tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
