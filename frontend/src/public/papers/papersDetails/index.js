import React from "react";
import { useEffect, useState} from "react";
import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Link } from "react-router-dom";
import like from "../../../static/images/like.png";
import tokenService from "../../../services/token.service";
import { Terminal } from "lucide-react"
import {Alert,AlertTitle} from "../../../components/ui/alert.tsx"
import {Heart,Download,User,ExternalLink,Calendar,BookOpen,FileText,Info,MessageSquare,Hash,Globe,Database} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card.tsx"
import { Button } from "../../../components/ui/button.tsx"
import { Badge } from "../../../components/ui/badge.tsx"
import { Separator } from "../../../components/ui/separator.tsx"
import { Skeleton } from "../../../components/ui/skeleton.tsx"
import { ScrollArea } from "../../../components/ui/scroll-area.tsx"

export default function PaperDetail() {
    let pathArray = window.location.pathname.split("/");
    const [paper,setPaper] = useState({});  
    const [paperId,setPaperId] = useState(pathArray[2]);
    const jwt = JSON.parse(window.localStorage.getItem("jwt") || "null");
    const user = tokenService.getUser();
    const [title, setTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true)

    function downloadFile(fileId,fileName) {
        fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${paperId}/download/${fileId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
          })
          .then((blob) => {
            const fileNameHeader = fileName;
            const fileNameMatch = /filename="?([^"]+)"?;?/i.exec(fileNameHeader);
            const suggestedFileName = fileNameMatch ? fileNameMatch[1] : `${fileName}`;
      
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", suggestedFileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
          })
          .catch((error) => {
            console.error("Error downloading file:", error);
          });
      }
      

    async function setUp() {
        setIsLoading(true)
        try {
            let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${paperId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let paper = await response.json();
            setPaper(paper);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }finally {
            setIsLoading(false)
          }
    }
    

    useEffect(() => {
        setUp();
    },[paperId]);


    async function likePaper(){
        if (!user || !user.id) {
            setTitle("You must be logged in to like a paper.");
            return;
        }
        try {
            let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${user.id}/like/${paperId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
            const message = await response.text();
            setTitle(message);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }

    return (
        <>
     <div className="ml-2 mt-3 px-4 max-w-1xl">
       {title && (
         <Alert className="mb-6">
           <div className="flex items-center gap-2">
             <Terminal className="h-4 w-4" />
             <AlertTitle>{String(title)}</AlertTitle>
           </div>
         </Alert>
       )}
 
       {isLoading ? (
         <Card>
           <CardHeader>
             <Skeleton className="h-8 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
           </CardHeader>
           <CardContent className="space-y-4">
             {Array(8)
               .fill(0)
               .map((_, i) => (
                 <Skeleton key={i} className="h-4 w-full" />
               ))}
           </CardContent>
         </Card>
       ) : paper ? (
         <Card className="shadow-lg">
           <CardHeader className="pb-3">
             <div className="flex justify-between items-start">
               <div>
                 <Badge variant="outline" className="mb-2">
                   {paper.type.name}
                 </Badge>
                 <CardTitle className="text-2xl font-bold">{paper.title}</CardTitle>
               </div>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={likePaper}
                 className="text-rose-500 hover:text-rose-700 hover:bg-rose-100"
               >
                 <Heart className="h-5 w-5" />
               </Button>
             </div>
             <CardDescription className="flex items-center gap-1 mt-2">
               <User className="h-4 w-4" />
               <span>{paper.authors}</span>
             </CardDescription>
           </CardHeader>
 
           <Separator />
 
           <CardContent className="pt-6 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex items-start gap-2">
                 <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Publication Year</p>
                   <p className="text-sm text-muted-foreground">{paper.publicationYear}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <BookOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Publisher</p>
                   <p className="text-sm text-muted-foreground">{paper.publisher}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <Info className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Publication Data</p>
                   <p className="text-sm text-muted-foreground">{paper.publicationData}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Source</p>
                   <p className="text-sm text-muted-foreground">{paper.source}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <Database className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Scopus</p>
                   <p className="text-sm text-muted-foreground">{paper.scopus}</p>
                 </div>
               </div>
             </div>
 
             <Separator className="my-2" />
 
             <div className="space-y-3">
               <div className="flex items-start gap-2">
                 <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Abstract</p>
                   {paper.abstractContent !== null && paper.abstractContent !=="" ?
                   <ScrollArea className="h-[120px] rounded-md border p-3 mt-1">
                     <p className="text-sm text-muted-foreground">{paper.abstractContent}</p>
                   </ScrollArea>
                   : <p className="text-sm text-muted-foreground">No abstract available</p>}
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Notes</p>
                   <p className="text-sm text-muted-foreground">{paper.notes}</p>
                 </div>
               </div>
 
               <div className="flex items-start gap-2">
                 <Hash className="h-4 w-4 mt-1 text-muted-foreground" />
                 <div>
                   <p className="text-sm font-medium">Keywords</p>
                   <div className="flex flex-wrap gap-1 mt-1">
                    {paper.keywords ? (
                     paper.keywords?.split(",").map((keyword, index) => (
                       <Badge key={index} variant="secondary" className="text-xs">
                         {keyword.trim()}
                       </Badge>
                     ))
                    ) : (
                      <p className="text-sm text-muted-foreground"></p>
                    )}
                   </div>
                 </div>
               </div>
             </div>
 
             {paper.paperFiles && paper.paperFiles.length > 0 && (
               <>
                 <Separator className="my-2" />
                 <div>
                   <h3 className="text-sm font-medium mb-2">Files</h3>
                   <div className="space-y-2">
                     {paper.paperFiles.map((paperFile, index) => (
                       <div key={index} className="flex items-center justify-between p-2 rounded-md border">
                         <span className="text-sm truncate max-w-[70%]">{paperFile.name}</span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => downloadFile(paperFile.id, paperFile.name)}
                           className="flex items-center gap-1"
                         >
                           <Download className="h-4 w-4" />
                           <span>Download</span>
                         </Button>
                       </div>
                     ))}
                   </div>
                 </div>
               </>
             )}
           </CardContent>
 
           <Separator />
 
           <CardFooter className="pt-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
               <User className="h-4 w-4 text-muted-foreground" />
               <span className="text-sm">
                 {paper.user.firstName} {paper.user.lastName}
               </span>
             </div>
             <Link to={`/users/${paper.user.id}`}>
               <Button variant="outline" size="sm" className="flex items-center gap-1">
                 <ExternalLink className="h-4 w-4" />
                 <span>View Profile</span>
               </Button>
             </Link>
           </CardFooter>
         </Card>
       ) : (
         <Alert variant="destructive">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error loading paper details</AlertTitle>
         </Alert>
       )}
     </div>
     </>
   )
}
