const dotenv = require("dotenv");
dotenv.config();
const express = require("express");

const mongoose = require('mongoose');
const connectDB = require("./config/dbConnection");
const path = require("path");
const {logger, logEvents} = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");


const port = process.env.PORT || 8000;

const rootRoutes = require("./routes/root");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();


app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/", express.static(path.join(__dirname, "public")));



connectDB();


app.use("/", rootRoutes);
app.use("/users", userRoutes);
app.use("/notes", noteRoutes);
app.use("/auth", authRoutes);


app.all("*", (req, res) => {
   res.status(404);
   if(req.accepts("html")) {
       res.sendFile(path.join(__dirname, "views", "404.html"));
   } else if(req.accepts("json")) {
       res.json({message: "404 Not Found"});
   } else {
       res.type("text").send("404 Not Found");
   }
});


app.use(errorHandler);



mongoose.connection.once("open", () => {
    console.log("mongodb connected");
    app.listen(port, () => {
        console.log("server is up and running on port " + port);
    });
});

mongoose.connection.on("error", (err) => {
    console.log(err);
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, "mongoErrLog.log");
})


