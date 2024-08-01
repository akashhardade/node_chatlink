const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Create a new chat room
router.post("/create-room", (req, res) => {
  const { roomName, password } = req.body;
  const folderPath = path.join(__dirname, "..", "rooms");
  try {
    const filePath = path.join(folderPath, `${roomName}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        { password: password || "", message: [], member: [] },
        null,
        2
      )
    );
    res.status(201).send("Chat Room Created Successfully");
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).send("Error creating file", error);
  }
});

// Add user to a chat room
router.post("/add-user-to-room", (req, res) => {
  const { roomName, username } = req.body;
  try {
    const folderPath = path.join(__dirname, "..", "rooms");
    const filePath = path.join(folderPath, `${roomName}.json`);
    console.log(filePath, "file path we get");
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return console.error(err);
        let jsonData = JSON.parse(data);

        jsonData.member.push(username);

        fs.writeFile(
          filePath,
          JSON.stringify(jsonData, null, 2),
          "utf8",
          (err) => {
            if (err) return console.error(err);
            console.log("File has been updated");
          }
        );
      });
    }
    res.status(200).json({ message: "User added to room successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});
module.exports = router;
