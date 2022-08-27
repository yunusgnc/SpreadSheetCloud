const express = require("express");
const { google } = require("googleapis");
const newman = require("newman");
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const app = express();

var collection = "./scenario.json";
app.get("/", async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const spreadsheetId = "1wf2_xrxc0mEh0SgNmEv8svqv20mx-0c5Q4rR3ShNTEc";

  console.log("Starting...");

  const nowDate = nowDateTime();
  console.log(nowDate);
  let tabName = `TFRCloud ${nowDate}`;

  if (collection == "./scenario.json") {
    tabName = `Scenario ${nowDate}`;
  }

  await addSheet(client, spreadsheetId, tabName);
  const dataTitle = [
    "Request Title",
    "Request Type",
    "Request Body",
    "Response Code",
    "Response Latency",
    "Response Status",
    "Request Date",
    "Response Details",
  ];
  await appendData(googleSheets, auth, spreadsheetId, tabName, dataTitle);

  newman
    .run(
      {
        collection: require(collection),
        reporters: "cli",
        delayRequest:1000
      },
      (error) => {
        if (error) {
          throw error;
        }
        console.log("Collection run complete.");
      }
    )
    .on("request", async function (error, args) {

      if (error) {
        console.error(error);
      } else {
        var raw;
        console.log(args.response._details.detail);
        if (args.request.method !== "GET" && args.request.method !== "DELETE") {
          delay(1000);
          raw = args.request.body.raw;
        } else {
          delay(1000);
          raw = "None";
        }
        // sleep(2000);

        let dateNow = new Date().toLocaleString("tr", {
          timeZone: "Europe/Istanbul",
        });
        var myData = [
          args.item.name,
          args.request.method,
          raw,
          args.response.code,
          args.response.responseTime,
          args.response.status,
          dateNow,
          args.response._details.detail,
        ];

        await appendData(googleSheets, auth, spreadsheetId, tabName, myData);
      }
    });

  res.send("Successfully submitted!");
});

function nowDateTime() {
  var date_ob = new Date();
  var day = ("0" + date_ob.getDate()).slice(-2);
  var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  var year = date_ob.getFullYear();
  delay(1000)
  var date = year + "-" + month + "-" + day;
  console.log(date);

  var hours = date_ob.getHours();
  var minutes = date_ob.getMinutes();
  var seconds = date_ob.getSeconds();

  var dateTime =
    year +
    "-" +
    month +
    "-" +
    day +
    " " +
    " " +
    hours +
    "-" +
    minutes +
    "-" +
    seconds;
  return dateTime;
}

async function addSheet(auth, spreadsheetId, tabName) {
  const api = google.sheets({ version: "v4", auth: auth });
  try {
    delay(1000)
    if (
      (
        await api.spreadsheets.get({ spreadsheetId: spreadsheetId })
      ).data.sheets.filter((sheet) => sheet.properties.title === tabName)
        .length === 0
    ) {
      await api.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: tabName } } }],
        },
      });
    }
  } catch (err) {
    delay(1000)
    console.log("Sheets API Error: " + err);
  }
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function appendData(googleSheets, auth, spreadsheetId, tabName, arr) {
  setTimeout(() => {
     googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: `${tabName}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [arr],
      },
    }).then(res=>{
      delay(1000)
      console.log(delay(1000),res)
    })
  }, 1000);
  
}

app.listen(1337, (req, res) => console.log("running port:1337 "));
