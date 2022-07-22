const express = require("express");
const { google } = require("googleapis");
const newman = require('newman');



const app = express();

app.get("/", async (req, res) => {



    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = "13MZayW78EVBIKMKR8eQSR4kp6-_A4hzg0Dtv9LSMHN8";

    const randNum = new Date().toLocaleString("tr", { timeZone: "Europe/Istanbul" })
        .replaceAll(":", "").replaceAll(".", "").replaceAll(" ", "")

    const tabName = `TRFCloud${randNum}`;


    await addSheet(client, spreadsheetId, tabName);
    var dataTitle = ["Request Title", "Request Type", "Request Body", "Response Code", "Response Latency", "Response Status"];
    await appendData(googleSheets, auth, spreadsheetId, tabName, dataTitle)
    newman.run({
        collection: require('./collection.json'),
        reporters: 'cli',
    }, (error) => {
        if (error) {
            throw error;
        }
        console.log('Collection run complete.');
    })
        .on('request', async function (error, args) {
            if (error) {
                console.error(error);
            } else {

                var raw;

                if (args.request.method !== "GET" && args.request.method !== "DELETE") {
                    raw = args.request.body.raw
                }
                else {
                    raw = "None"
                }
                var myData = [args.item.name, args.request.method, raw, args.response.code, args.response.responseTime, args.response.status]
                await appendData(googleSheets, auth, spreadsheetId, tabName, myData)
            }
        })

    res.send("Successfully submitted!");
})

async function addSheet(auth, spreadsheetId, tabName) {
    const api = google.sheets({ version: 'v4', auth: auth });
    try {
        if ((await api.spreadsheets.get({ spreadsheetId: spreadsheetId })).data.sheets
            .filter(sheet => sheet.properties.title === tabName).length === 0) {
            await api.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: { requests: [{ addSheet: { properties: { title: tabName } } }] }
            });
        }
    } catch (err) {
        console.log('Sheets API Error: ' + err);
    }
}

async function appendData(googleSheets, auth, spreadsheetId, tabName, arr) {
    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `${tabName}!A:E`,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [arr],
        },
    });
}

app.listen(1337, (req, res) => console.log("running 1337 port"))