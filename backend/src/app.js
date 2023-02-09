const express = require("express");
const mysql = require("mysql");
const uniqid = require("uniqid");
const moment = require("moment");
const cors = require("cors");
const sqlConn = require("./database.js");
const connection = require("./database.js");
const app = express();
const port = 3000;

app.use(express.json());

app.use(cors());

app.use(function (err, req, res, next) {
  if (err) {
    msg = "Please enter Data in JSON format!!!";
    return res.status(415).json({ status: 415, msg });
  }
  next();
});

app.post("/holiday/create", (req, res, next) => {
  let jsonMsg = checkJsonData(req);
  if (jsonMsg === "Accept & Content-Type exists!!") {
    const holiday = {
      HolidayId: req.body.HolidayId,
      Date: req.body.Date,
      Description: req.body.Description,
      Type: req.body.Type,
      Location: req.body.Location,
    };
    msgResult = checkHolidayData(req.body);
    if (msgResult) {
      return res.status(400).send(msgResult);
    } else {
      msgResult = checkDuplicate(holiday);
      if (msgResult === "save Record") {
        holiday.HolidayId = uniqid();
        let sql = "INSERT INTO ETT_HOLIDAY VALUES (?,?,?,?,?,?,?,?,?,?)";
        let timeStamp = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        sqlConn.query(
          sql,
          [
            holiday.HolidayId,
            "OJT",
            holiday.Location,
            holiday.Date,
            holiday.Type,
            holiday.Description,
            "Rajasree",
            "Rajasree",
            timeStamp,
            timeStamp,
          ],
          function (error, resultset) {
            if (error) {
              holiday.HolidayId = "";
              msgResult = "Conflict! Record Already Exists!!!";
              return res.status(409).json({ status: 409, Message: msgResult });
            } else {
              msgInfo = "Record saved successfully!!!";
              return res
                .status(200)
                .json({ status: 200, msgInfo, Holiday: holiday });
            }
          }
        );
      } else {
        return res.status(428).json({ status: 428, Message: msgResult });
      }
    }
  } else {
    return res.status(400).send(jsonMsg);
  }
});
app.delete("/holiday/delete/:id", async (req, res) => {
  let jsonMsg = checkJsonData(req);
  if (jsonMsg === "Accept & Content-Type exists!!") {
    if (req.params.id) {
      let sql = "DELETE FROM ETT_HOLIDAY WHERE HOLIDAY_ID = ?";
      sqlConn.query(sql, req.params.id, function (err, resultset) {
        if (err) {
          return res.status(503).json({
            message: "Database Not Connected sql query",
            status: err.code,
          });
        }
        if (resultset.affectedRows === 0) {
          let msg = "ID doesn't exits";
          return res.status(404).json({ status: 404, msg });
        } else {
          msgResult = "Record deleted successfully";
          return res.json(msgResult);
        }
      });
    }
  } else {
    return res.status(400).send(jsonMsg);
  }
});

app.get("/holidays/:year", (req, res) => {
  let jsonMsg = checkJsonData(req);

  if (jsonMsg === "Accept & Content-Type exists!!") {
    searchResults(req.params.year, req, res);
  } else {
    res.status(400).send(jsonMsg);
  }
});

app.get("/holiday/:id", (req, res) => {
  let holidayId = req.params.id;
  let msgResult;
  let jsonMsg = checkJsonData(req);
  res.status("");
  if (jsonMsg === "Accept & Content-Type exists!!") {
    let sql =
      "SELECT HOLIDAY_ID AS HolidayId, LOC_CD AS Location, HOLIDAY AS Date, HOLIDAY_TYPE AS Type, HOLIDAY_DESC AS Description FROM ETT_HOLIDAY WHERE HOLIDAY_ID = ?";
    sqlConn.query(sql, holidayId, function (err, resultset, fields) {
      if (err) {
        msgResult = "Database Not Connected sql query";
        // return res.status(503).json({ status: 503, message: msgResult });
        return res.status(503).send({ Status: 503, msgResult });
      }
      if (resultset.length == 0) {
        msgResult = "Holiday Id does not exist";
        return res.status(404).json({ status: 404, msgResult });
      }
      resultset[0].Date = moment(resultset[0].Date).format("YYYY-MM-DD");
      msgResult = "Record retrieved successfully!!";
      return res
        .status(200)
        .json({ Status: 200, Message: msgResult, Holiday: resultset[0] });
    });
  } else {
    return res.status(400).send(jsonMsg);
  }
});
app.put("/holiday/:id", (req, res) => {
  const holiday = {
    HolidayId: req.params.id,
    Date: req.body.Date,
    Description: req.body.Description,
    Type: req.body.Type,
    Location: req.body.Location,
  };
  let msgInfo;

  if (!req.params.id) {
    return res.status(404).send("Holiday Id does not exist");
  }
  let jsonMsg = checkJsonData(req);
  if (jsonMsg === "Accept & Content-Type exists!!") {
    msgResult = checkHolidayData(req.body);
    if (msgResult) {
      return res.status(404).send(msgResult);
    } else {
      //
      let sql = "SELECT * FROM ETT_HOLIDAY WHERE HOLIDAY_ID = ?";
      sqlConn.query(sql, [holiday.HolidayId], (err, resultset, fields) => {
        if (err) {
          msgResult = "Database Not Connected sql query";
          return res.status(503).json({ status: 503, message: msgResult });
        }
        if (resultset.length === 0) {
          msgInfo = "Holiday Id does not exist in the Database";
          return res.status(404).json({ status: 404, msgInfo });
        } else {
          let querySql =
            "SELECT HOLIDAY_ID FROM ETT_HOLIDAY WHERE LOC_CD = ? AND HOLIDAY = ? AND HOLIDAY_TYPE = ?";
          sqlConn.query(
            querySql,
            [holiday.Location, holiday.Date, holiday.Type],
            (err, resultset) => {
              if (err) {
                msgResult = "Database Not Connected sql query";
                return res
                  .status(503)
                  .json({ status: 503, message: msgResult });
              }
              if (
                resultset[0] &&
                holiday.HolidayId != resultset[0].HOLIDAY_ID
              ) {
                msgResult = "Record already exists!!!";
                return res.status(400).send(msgResult);
              } else {
                let timeStamp = moment(Date.now()).format(
                  "YYYY-MM-DD HH:mm:ss"
                );
                let sql = mysql.format(
                  "UPDATE ETT_HOLIDAY SET LOC_CD = ?, HOLIDAY = ?, HOLIDAY_TYPE = ?, HOLIDAY_DESC = ?, UPD_BY_USER = ?, UPD_BY_TS = ? WHERE HOLIDAY_ID = ?"
                );
                sqlConn.query(
                  sql,
                  [
                    holiday.Location,
                    holiday.Date,
                    holiday.Type,
                    holiday.Description,
                    "Rajasree",
                    timeStamp,
                    holiday.HolidayId,
                  ],
                  (err, resultset) => {
                    if (err) {
                      msgResult = "Database Not Connected sql query";
                      return res
                        .status(503)
                        .json({ status: 503, message: msgResult });
                    }
                    msgInfo = "Record updated successfully";
                    return res.status(201).json({
                      status: 201,
                      Message: msgInfo,
                      Holiday: holiday,
                    });
                  }
                );
              }
            }
          );
        }
      });
    }
  } else {
    return res.status(400).send(jsonMsg);
  }
});
function checkHolidayData(holiday) {
  let msg = "";
  if (
    !holiday.hasOwnProperty("Type") ||
    !holiday.hasOwnProperty("Date") ||
    !holiday.hasOwnProperty("Location") ||
    !holiday.hasOwnProperty("Description")
  ) {
    msg =
      "Please enter valid properties Type, Description, Date and Location!!";
  } else {
    if (
      !holiday.Type ||
      !holiday.Location ||
      !holiday.Date ||
      !holiday.Description
    ) {
      msg = "All fields are mandatory!!";
    } else if (
      holiday.Type === " " ||
      holiday.Location === " " ||
      holiday.Date === " " ||
      holiday.Description === " "
    ) {
      msg = "All fields are mandatory!!";
    }
  }
  if (!msg) {
    if (!(holiday.Type === "F" || holiday.Type === "O")) {
      msg = "Holiday type should be F or O";
    }
    if (
      !(
        holiday.Location === "ALL" ||
        holiday.Location === "USA" ||
        holiday.Location === "IND"
      )
    ) {
      msg = msg + "\n" + "Holiday type should be ALL or USA or IND";
    }
    let isDateValid = new Date(holiday.Date).getTime() > 0;
    if (!isDateValid) {
      msg = msg + "\n" + "Please enter valid Date!!";
    }
  }
  return msg;
}
function checkDuplicate(holiday) {
  let msgDuplicate = "save Record";
  let sql =
    "SELECT * FROM ETT_HOLIDAY WHERE HOLIDAY = ? AND HOLIDAY_TYPE = ? AND LOC_CD = ?";
  sqlConn.query(
    sql,
    [holiday.Date, holiday.Type, holiday.Location],
    (err, resultset, fields) => {
      if (err) {
        return res.status(503).json({
          message: "Database Not Connected sql query",
          status: err.code,
        });
      }
      if (resultset == "") {
        msgDuplicate = "Unable to fetch";
      }
      if (resultset.length > 0) {
        msgDuplicate = "Conflict! Record Already exists.";
      }
    }
  );
  return msgDuplicate;
}

/* WORKING ON THIS */
async function searchResults(selectedYear, req, res) {
  let sql =
    "SELECT HOLIDAY_ID as HolidayId, LOC_CD as Location, HOLIDAY as Date, HOLIDAY_TYPE as Type, HOLIDAY_DESC as Description FROM ETT_HOLIDAY WHERE YEAR(HOLIDAY) = ? ORDER BY HOLIDAY";

  // if connected to db
  sqlConn.query(sql, selectedYear, function (error, holidays, fields) {
    // if error
    if (error) {
      return res.status(503).json({
        message: "Database Not Connected sql query",
        status: error.code,
      });
    }

    // if no holidays
    if (holidays && holidays.length === 0) {
      return res.status(404).json({ message: "No Holiday Data Available!!" });
    }

    // loop through & format date
    for (i = 0; i < holidays.length; i++) {
      holidays[i].Date = moment(holidays[i].Date).format("YYYY-MM-DD");
    }

    return res.status(200).json({
      message: selectedYear + " Holidays retrieved successfully!! ",
      Holidays: holidays,
    });
  });
}

function checkJsonData(req) {
  let jsonMsg = "Accept & Content-Type exists!!";
  if (
    req.headers["content-type"] !== "application/json" ||
    req.headers["content-type"] === undefined
  ) {
    jsonMsg = "Server requires application/json for content-type ";
  } else if (
    req.headers["accept"] !== "application/json" ||
    req.headers["accept"] === undefined
  ) {
    jsonMsg = "Server requires application/json for accept";
  }
  return jsonMsg;
}

app.all("/*", (req, res) => {
  let msg = "Bad Request!!";
  return res.status(400).json({ Status: 400, msg });
});

app.listen(port, () => {
  try {
    console.log("Server is up on port" + port);
  } catch {
    if (err.errno === "EADDRINUSE") {
      console.log(port + "is busy");
    } else {
      console.log(err);
    }
  }
});
