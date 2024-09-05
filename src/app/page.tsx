"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { databases, account, DATABASE_ID, COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useEffect } from "react";
import { AppwriteException } from 'appwrite';

export default function Home() {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.orderDesc("$createdAt"),
          Query.limit(10)
        ]
      );
      setReports(response.documents);
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
    const [localities, setLocalities] = useState<string[]>([]);
    const [description, setDescription] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!user) {
        toast({ title: "Please log in to submit a report", variant: "destructive" });
        return;
      }
      
      try {
        // Refresh session
        await account.getSession('current');
        
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          "unique()",
          {
            type,
            subtype,
            severity,
            pincode,
            localities,
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

        // Close the drawer
        setDrawerOpen(false);
      } catch (error) {
        console.error("Error submitting report:", error);
        if (error instanceof AppwriteException) {
          toast({ title: "Error submitting report", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "An unexpected error occurred", variant: "destructive" });
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <RadioGroup value={type} onValueChange={setType}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hazard" id="hazard" />
            <Label htmlFor="hazard">Hazard</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="disaster" id="disaster" />
            <Label htmlFor="disaster">Disaster</Label>
          </div>
        </RadioGroup>

        <Select value={subtype} onValueChange={setSubtype}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {type === "hazard" ? (
              <>
                <SelectItem value="chemical">Chemical</SelectItem>
                <SelectItem value="biological">Biological</SelectItem>
                {/* Add more hazard types */}
              </>
            ) : (
              <>
                <SelectItem value="earthquake">Earthquake</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
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
          type="text"
          placeholder="Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
        />

        {/* Add checkbox list for localities based on pincode */}
        {/* This is a placeholder, you'll need to implement locality fetching based on pincode */}
        <div className="space-y-2">
          <Checkbox id="locality1" onCheckedChange={(checked) => 
            setLocalities(prev => checked 
              ? [...prev, "Locality 1"] 
              : prev.filter(l => l !== "Locality 1")
            )
          }/>
          <Label htmlFor="locality1">Locality 1</Label>
        </div>

        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button type="submit">Submit Report</Button>
      </form>
    );
  };

  const ReportCard = ({ report }) => (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm p-4 mb-4">
      <h3 className="font-semibold text-lg">{report.type} - {report.subtype}</h3>
      <p className="text-sm text-muted-foreground">Severity: {report.severity}</p>
      <p className="text-sm text-muted-foreground">Location: {report.pincode}</p>
      <p className="mt-2">{report.description}</p>
      <p className="text-xs text-muted-foreground mt-2">
        Reported on: {new Date(report.$createdAt).toLocaleString()}
      </p>
    </div>
  );

  return (
    <div className="bg-background h-full font-[font-family:var(--font-geist-sans)] w-md mx-auto">
      <nav className="px-4 sticky flex items-center justify-between top-0 z-50 h-16 w-full bg-background border-b-2 border-primary/10">
        <div className="text-xl font-bold text-foreground">CrowdSync</div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button size="sm" className="items-center">
              <PlusIcon className="h-4 w-4 mr-1" />
              <span className="leading-none">Report</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-w-md mx-auto">
            <DrawerTitle/>
            {user ? <ReportForm /> : <Auth />}
          </DrawerContent>
        </Drawer>
      </nav>
      <main>
        <ScrollArea className="min-h-[calc(100vh-128px)] px-4 py-2">
          <div>
            {user ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-lg">
                    Welcome,{" "}
                    {user.email
                      ? `${user.name} ${user.email.split("@")[0]}`
                      : "User"}
                    !
                  </p>
                  <Button onClick={logout} variant="default">
                    Logout
                  </Button>
                </div>
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
