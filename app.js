const express = require("express");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const fs= require("fs");


const app= express();

app.use(bodyParser.urlencoded({extended:true}));




const filePath = "C:\\Windows\\System32\\drivers\\etc\\hosts";

const redirectPath = "127.0.0.1";

const date= new Date();

let d = date.getDay();

let Day="";

switch(d){
    case 0:
        Day="Su";
        break;
    case 1:
        Day="M";
        break;
    case 2:
        Day="Tu";
        break;
    case 3:
        Day="W";
        break;
    case 4:
        Day="Th";
        break;
    case 5:
         Day="F";
        break;
    case  6:
        Day="Sa";
        break;

}
mongoose.connect('mongodb://localhost/AppRestrictDB', {useNewUrlParser: true, useUnifiedTopology: true});


const appSchema= new mongoose.Schema({
    name:String,
    url:String
})

const applist = mongoose.model("applist",appSchema);

const app1= new applist({
    name:"Facebook",
    url:"facebook.com"
})

const app2= new applist({
    name:"Twitter",
    url:"twitter.com"
})

const app3= new applist({
    name:"Instagram",
    url:"instagram.com"
})

const defaultItems=[app1,app2,app3];

const restrictSchema = new mongoose.Schema({
            day:String,
            restrictedApps:[appSchema],
            StartTime:Number,
            EndTime:Number
});

const restrict = mongoose.model("restrict",restrictSchema);


app.route("/")
.get(function(req,res){

    applist.find({},function(err,foundItems){
        if(!err)
        {
            if(foundItems.length === 0)
            {
                applist.insertMany(defaultItems,function(err){
                    if(!err)
                    {
                        console.log("Insert Success");
                    }
                });
                res.redirect("/");
            }
            res.send(foundItems);

        }
            
        });

})
.post(function(req,res){

    const day= req.body.Day;
    const start=req.body.Start;
    const end= req.body.End;
    const restrictList = new restrict({
            day:day,
            restrictedApps:defaultItems,
            StartTime:start,
            EndTime:end

    });

    restrictList.save(function(err){
        if(err)
        {
            console.log("Failed to Insert");
        }
    })

    restrict.find({},function(foundItems){
        res.send(foundItems);
    })
    
    res.redirect("/restrictions");   
});

app.route("/restrictions")

.get(function(req,res){
    
    restrict.find({day:Day},function(err,foundItems){
                if(!err)
                {
                    res.send(foundItems.restrictedApps);
                }
            })
        blockerFunction();
        setInterval(blockerFunction,10,000);
})
.post(function(req,res){
        const day= Day;
        const name=req.body.name;
        const url= req.body.url;

        const newList = new applist({
            name:name,
            url:url
        });
    
    restrict.findOne({day:Day},function(err,foundItems){
                if(!err)
                {
                    foundItems.restrictedApps.push(newList);
                    foundItems.save();
                    res.send(foundItems.restrictedApps)
                }
            })

    
})



let blockerFunction =()=>{
    let hours= date.getHours();

    restrict.finOne({day:Day},function(err,foundList){
        if(!err)
        {
            let s=foundList.StartTime;
            let e=foundList.EndTime;
            if(hours>=s && hours <= e)
            {
                fs.readFile(filePath,function(err,data){
                    if(err)
                    {
                        return console.log("error");
                    }

                    fileContents= data.toString();

                    for(let i=0; i<foundList.restrictedApps;i++)
                    {
                        let blockWebsite = "\n"+redirectPath+" "+foundList.restrictedApps[i].url;

                        if(fileContents.indexOf(blockWebsite)<0)
                        {
                            fs.appendFile(filePath,blockWebsite,(err)=>{
                                if(!err)
                                {
                                    console.log("Updated Successfully");
                                }
                            });
                        }
                    }

                });
            }
            else{
                let completeContent = '';

        
                fs.readFileSync(filePath)
                    .toString()
                    .split('\n')
                    .forEach((line) => {
                        let flag = 1;
                        
                        for (let i=0; i<foundList.restrictedApps.length; i++) {
                            
                            if (line.indexOf(foundList.restrictedApps[i].url) >= 0) {
                                flag = 0;
                                break;
                            }
                        }

                        if (flag == 1) {
                            if (line === '')
                                completeContent += line;
                            else
                                completeContent += line + "\n";
                        }

                    });

                    
                fs.writeFile(filePath, completeContent, (err) => {
                    if (err) {
                        return console.log('Error!', err);
                    }
                });
            }

        }
    })

}
app.listen(3000,function(){
    console.log("Server up in port 3000");
  });