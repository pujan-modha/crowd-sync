"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogIn, LogOutIcon, PlusIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Auth } from "@/components/Auth";
import dynamic from "next/dynamic";
import Image from "next/image";
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
import { databases, account, DATABASE_ID } from "@/lib/appwrite";
import { AppwriteException, Query, ID } from "appwrite";
import { useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentAlt,
  faFlag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

const ClientSideMap = dynamic(() => import("@/components/ClientSideMap"), {
  ssr: false,
});

const USER_PROFILES_COLLECTION_ID = "66da4caa000ad6801495";
const POSTS_COLLECTION_ID = "66d9d751000060119f8b";
const USER_REPORTS_COLLECTION_ID = "user_reports";
const COMMENTS_COLLECTION_ID = "comments";

export default function Home() {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userPincode, setUserPincode] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const fetchReports = async () => {
    if (!userPincode) {
      console.log("User pincode not set, cannot fetch posts");
      return;
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [
          Query.equal("pincode", userPincode),
          Query.orderDesc("$createdAt"),
          Query.limit(10),
        ]
      );
      const parsedPosts = await Promise.all(
        response.documents.map(async (doc) => {
          const userReports = await databases.listDocuments(
            DATABASE_ID,
            USER_REPORTS_COLLECTION_ID,
            [Query.equal("post_id", doc.$id)]
          );
          return {
            ...doc,
            localities: doc.localities.map((localityString) =>
              JSON.parse(localityString)
            ),
            report_count: userReports.total,
          };
        })
      );
      setReports(parsedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({ title: "Error fetching posts", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (user && userPincode) {
      fetchReports();
    }
  }, [user, userPincode]);

  const checkUserProfile = async () => {
    if (!user) return;

    setIsLoadingProfile(true);
    try {
      console.log("Checking user profile for user ID:", user.$id);
      console.log("Using DATABASE_ID:", DATABASE_ID);
      console.log("Using COLLECTION_ID:", USER_PROFILES_COLLECTION_ID);

      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_PROFILES_COLLECTION_ID,
        [Query.equal("user_id", user.$id)]
      );

      console.log("Response from listDocuments:", response);

      if (response.documents.length === 0) {
        console.log("No existing profile found, creating new one");
        // User profile doesn't exist, create one
        try {
          const newProfile = await databases.createDocument(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            ID.unique(),
            {
              user_id: user.$id,
              pincode: "", // Set an empty string as the initial value
            }
          );
          console.log("New profile created:", newProfile);
          setUserPincode(""); // This will ensure the form stays visible
          toast({
            title: "Profile created",
            description: "Please set your pincode.",
            variant: "default",
          });
        } catch (createError) {
          console.error("Error creating user profile:", createError);
          if (createError instanceof AppwriteException) {
            console.error("Appwrite error code:", createError.code);
            console.error("Appwrite error message:", createError.message);
            console.error("Appwrite error type:", createError.type);
          }
          toast({
            title: "Error creating user profile",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } else {
        console.log("Existing profile found:", response.documents[0]);
        // User profile exists
        const existingProfile = response.documents[0];
        if (existingProfile.pincode === "") {
          setUserPincode(""); // This will show the form if pincode is empty
          toast({
            title: "Pincode not set",
            description: "Please set your pincode.",
            variant: "default",
          });
        } else {
          setUserPincode(existingProfile.pincode);
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      if (error instanceof AppwriteException) {
        console.error("Appwrite error code:", error.code);
        console.error("Appwrite error message:", error.message);
        console.error("Appwrite error type:", error.type);
      }
      toast({
        title: "Error checking user profile",
        description: "Please check your database and collection IDs.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const UserProfileForm = () => {
    const [pincode, setPincode] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) return;

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          USER_PROFILES_COLLECTION_ID,
          [Query.equal("user_id", user.$id)]
        );

        if (response.documents.length > 0) {
          // Update existing profile
          await databases.updateDocument(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            response.documents[0].$id,
            {
              pincode: pincode,
            }
          );
        } else {
          // Create new profile
          await databases.createDocument(
            DATABASE_ID,
            USER_PROFILES_COLLECTION_ID,
            ID.unique(),
            {
              user_id: user.$id,
              pincode: pincode,
            }
          );
        }
        setUserPincode(pincode); // Update the parent component's state
        toast({ title: "Profile updated successfully!" });
        fetchReports(); // Fetch reports for the new pincode
      } catch (error) {
        console.error("Error updating user profile:", error);
        toast({
          title: "Error updating profile",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Set Your Pincode</h2>
        <p className="mb-4 text-gray-600">
          Please set your pincode to continue using the app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Save Pincode
          </Button>
        </form>
      </div>
    );
  };

  const ReportForm = ({ setDialogOpen, fetchReports }) => {
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
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const handlePincodeChange = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newPincode = e.target.value;
      if (newPincode.length <= 6) {
        setPincode(newPincode);
        if (newPincode.length === 6) {
          try {
            const res = await axios.request({
              method: "GET",
              url: `https://india-pincode-with-latitude-and-longitude.p.rapidapi.com/api/v1/pincode/${newPincode}`,
              headers: {
                "x-rapidapi-key":
                  "756493b2cfmsh2115bf55dcb256bp10e017jsn0d50ad02fbe9",
                "x-rapidapi-host":
                  "india-pincode-with-latitude-and-longitude.p.rapidapi.com",
              },
            });
            if (res.data.length === 0) {
              setPincodeError("Invalid pincode");
              setFetchedLocalities([]);
            } else {
              setPincodeError(null);
              setFetchedLocalities(res.data);
            }
          } catch (error) {
            console.error("Error fetching localities:", error);
            setPincodeError("Error fetching localities");
            setFetchedLocalities([]);
          }
        } else {
          setPincodeError(null);
          setFetchedLocalities([]);
        }
      }
    };

    const validateForm = () => {
      const errors: { [key: string]: string } = {};
      if (!type) errors.type = "Type is required";
      if (!subtype) errors.subtype = "Subtype is required";
      if (!severity) errors.severity = "Severity is required";
      if (!pincode) errors.pincode = "Pincode is required";
      if (localities.length === 0)
        errors.localities = "At least one locality is required";

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
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

      if (!validateForm()) {
        // Form is invalid, errors will be displayed
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
          POSTS_COLLECTION_ID,
          ID.unique(),
          {
            type,
            subtype,
            severity,
            pincode,
            localities: localitiesAsStrings,
            description,
            user_id: user.$id,
          }
        );
        console.log("Document created successfully:", response);
        toast({
          title: "Report submitted successfully!",
        });

        // Clear the form
        setType("");
        setSubtype("");
        setSeverity("");
        setPincode("");
        setLocalities([]);
        setDescription("");
        setFormErrors({});

        // Close the dialog
        setDialogOpen(false);

        // Refresh the feed
        fetchReports();
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    };

    const handleGetCurrentLocation = () => {
      if (typeof window !== "undefined") {
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="space-y-4"
        >
          <RadioGroup
            value={type}
            onValueChange={setType}
            className="grid grid-cols-2 gap-2"
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
          {formErrors.type && (
            <p className="text-red-500 text-sm">{formErrors.type}</p>
          )}

          <Select value={subtype} onValueChange={setSubtype}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {type === "Hazard" ? (
                <>
                  <SelectItem value="car accident">Car Accident</SelectItem>
                  <SelectItem value="tree fallen">Tree Fallen</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="chemical spill">Chemical Spill</SelectItem>
                  <SelectItem value="gas leak">Gas Leak</SelectItem>
                  <SelectItem value="electrical fire">
                    Electrical Fire
                  </SelectItem>
                  <SelectItem value="building collapse">
                    Building Collapse
                  </SelectItem>
                  <SelectItem value="bridge collapse">
                    Bridge Collapse
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  {/* Add more hazard types */}
                </>
              ) : (
                <>
                  <SelectItem value="dam_break">Dam Break</SelectItem>
                  <SelectItem value="tsunami">Tsunami</SelectItem>
                  <SelectItem value="volcano eruption">
                    Volcano Eruption
                  </SelectItem>
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
          {formErrors.subtype && (
            <p className="text-red-500 text-sm">{formErrors.subtype}</p>
          )}

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
          {formErrors.severity && (
            <p className="text-red-500 text-sm">{formErrors.severity}</p>
          )}

          <Input
            type="number"
            max={999999}
            placeholder="Pincode"
            value={pincode}
            onChange={handlePincodeChange}
          />
          {pincode_error && (
            <p className="text-red-500 text-sm">{pincode_error}</p>
          )}
          {formErrors.pincode && (
            <p className="text-red-500 text-sm">{formErrors.pincode}</p>
          )}

          {/* Locality checkboxes */}
          <div className="flex flex-wrap gap-2 items-center">
            <Checkbox
              id="current-location"
              onCheckedChange={(checked) => {
                if (checked) {
                  handleGetCurrentLocation();
                } else {
                  setLocalities((prev) =>
                    prev.filter((l) => l.name !== "Current Location")
                  );
                }
              }}
            />
            <Label htmlFor="current-location">Add current location</Label>
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
          </div>
          {formErrors.localities && (
            <p className="text-red-500 text-sm">{formErrors.localities}</p>
          )}

          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button type="submit">Submit Report</Button>
        </form>
      </div>
    );
  };

  const reportSameIssue = async (postId: string) => {
    if (!user) {
      toast({
        title: "Please log in to report an issue",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if the user has already reported this issue
      const existingReports = await databases.listDocuments(
        DATABASE_ID,
        USER_REPORTS_COLLECTION_ID,
        [Query.equal("user_id", user.$id), Query.equal("post_id", postId)]
      );

      if (existingReports.total > 0) {
        toast({
          title: "You've already reported this issue",
          variant: "default",
        });
        return;
      }

      // Create a new user report
      await databases.createDocument(
        DATABASE_ID,
        USER_REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          post_id: postId,
        }
      );

      // Update the local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.$id === postId
            ? { ...report, report_count: (report.report_count || 0) + 1 }
            : report
        )
      );

      toast({
        title: "Issue reported successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast({
        title: "Error reporting issue",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [
          Query.equal("post_id", postId),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]
      );
      setComments(response.documents);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({ title: "Error fetching comments", variant: "destructive" });
    }
  };

  const handleCommentSubmit = useCallback(
    async (e, comment) => {
      e.preventDefault();
      if (!user || !currentPostId || !comment.trim()) return;

      try {
        await databases.createDocument(
          DATABASE_ID,
          COMMENTS_COLLECTION_ID,
          ID.unique(),
          {
            post_id: currentPostId,
            user_id: user.$id,
            content: comment.trim(),
            created_at: new Date().toISOString(),
          }
        );
        setNewComment("");
        fetchComments(currentPostId);
        toast({ title: "Comment added successfully" });
      } catch (error) {
        console.error("Error adding comment:", error);
        toast({ title: "Error adding comment", variant: "destructive" });
      }
    },
    [user, currentPostId]
  );

  const CommentDrawer = () => {
    const [localComment, setLocalComment] = useState("");

    const handleLocalCommentSubmit = (e) => {
      handleCommentSubmit(e, localComment);
      setLocalComment("");
    };

    return (
      <Drawer open={commentDrawerOpen} onOpenChange={setCommentDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Comments</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <form onSubmit={handleLocalCommentSubmit} className="mb-4">
              <Input
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <Button type="submit" className="mt-2">
                Post Comment
              </Button>
            </form>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.$id} className="pb-2">
                  <div className="flex items-center">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="w-5 h-5 mr-2 rounded-full bg-primary/10 p-2 text-foreground"
                    />
                    <div className="mb-2">
                      <p className="items-center">
                        {comment.user_id
                          ? `${user?.name} ${user?.email.split("@")[0]}`
                          : "User"}

                        <span className="text-xs text-primary/70 ml-1">
                          ({new Date(comment.$createdAt).toLocaleString()})
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="border-b pb-1 ml-11">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  };

  const ReportCard = ({ report }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleFlagConfirm = () => {
      // Here you would implement the actual flagging logic
      console.log("Report flagged:", report.$id);
      setDialogOpen(false);
    };

    const handleCommentClick = () => {
      setCurrentPostId(report.$id);
      fetchComments(report.$id);
      setCommentDrawerOpen(true);
    };

    return (
      <div className="bg-white border border-foreground/10 shadow rounded-lg px-4 pt-4 pb-2 mb-4 font-[family-name:var(--font-geist-sans)]">
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
              <p className="text-xs text-primary/70">
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
                  <Button
                    size="sm"
                    onClick={handleFlagConfirm}
                    className="w-full"
                  >
                    Confirm
                  </Button>
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

        <ClientSideMap report={report} />
        <p className="mt-2">{report.description}</p>

        <div className="flex w-full mt-2">
          <Button size="sm" onClick={() => reportSameIssue(report.$id)}>
            Report same issue ({report.report_count || 0})
          </Button>
          <Button
            size="icon"
            variant="link"
            className="ml-auto"
            onClick={handleCommentClick}
          >
            <FontAwesomeIcon
              icon={faCommentAlt}
              className="w-6 h-6 text-foreground/70"
            />
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      checkUserProfile();
    } else {
      setIsLoadingProfile(false);
      setUserPincode("");
    }
  }, [user]);

  return (
    <div className="bg-background font-[font-family:var(--font-geist-sans)] w-md mx-auto">
      <nav className="px-4 sticky flex items-center justify-between top-0 z-50 h-16 w-full bg-background border-b-2 border-primary/10">
        <div className="text-xl font-bold text-foreground">CrowdSync</div>
        <div className="flex items-center gap-2">
          {user && (
            <Button
              size="sm"
              onClick={logout}
              variant="default"
              className="text-foreground"
            >
              <LogOutIcon className="h-4 w-4 mr-1" />
              <span className="leading-none">Logout</span>
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              {user ? (
                <Button size="sm" className="items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  <span className="leading-none">Report</span>
                </Button>
              ) : (
                <Button size="sm" className="items-center">
                  <LogIn className="h-4 w-4 mr-1" />
                  <span className="leading-none">Login</span>
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              {/* <DialogTitle/> */}
              {user ? (
                <ReportForm
                  setDialogOpen={setDialogOpen}
                  fetchReports={fetchReports}
                />
              ) : (
                <Auth />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </nav>
      <main>
        <ScrollArea className="min-h-[calc(100vh-128px)] h-full px-4 py-2">
          {user ? (
            isLoadingProfile ? (
              <p>Loading profile...</p>
            ) : userPincode === null || userPincode === "" ? (
              <UserProfileForm />
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4">
                  Recent Reports for PIN {userPincode}
                </h2>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <ReportCard key={report.$id} report={report} />
                  ))
                ) : (
                  <p>No reports found for your pincode.</p>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col justify-center items-center h-full">
              <div className="flex h-screen">
                <div className="flex flex-col">
                  <div className="flex mx-auto mt-auto">
                    <p className="text-xl font-semibold text-foreground">
                      Please login to view reports
                    </p>
                  </div>
                  <div className="flex mx-auto">
                    <Image
                      src="/new-style.svg"
                      alt="CrowdSync"
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="flex mx-auto mb-auto">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        {user ? (
                          <Button size="sm" className="items-center">
                            <PlusIcon className="h-4 w-4 mr-1" />
                            <span className="leading-none">Report</span>
                          </Button>
                        ) : (
                          <Button size="sm" className="items-center">
                            <LogIn className="h-4 w-4 mr-1" />
                            <span className="leading-none">Login</span>
                          </Button>
                        )}
                      </DialogTrigger>
                      <DialogContent className="max-w-md mx-auto">
                        {/* <DialogTitle/> */}
                        {user ? (
                          <ReportForm
                            setDialogOpen={setDialogOpen}
                            fetchReports={fetchReports}
                          />
                        ) : (
                          <Auth />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </main>
      <footer className="border-t-2 border-foreground/10 bg-background">
        <div className="container flex h-16 items-center justify-center">
          <p className="text-sm text-primary/70">
            CrowdSync is a crowdsourced disaster reporting tool.
          </p>
        </div>
      </footer>
      <CommentDrawer />
    </div>
  );
}
