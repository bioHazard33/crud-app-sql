const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const emailValidator = require("email-validator");
const db = require("../lib/mysql/mysql");
const { to } = require("await-to-js");

// Get all Students
router.get("/", async (req, res) => {
    let [error, data] = await to(
        db.execQuery("SELECT id,username FROM students")
    );
    if (error) {
        return res.status(500).send({ data: null, error });
    }
    res.status(200).send({ data, error: null });
});

// Get Specific Student Whole Details
router.get("/:id", auth, async (req, res) => {
    if (req.id !== parseInt(req.params.id))
        return res
            .status(401)
            .send({
                data: null,
                error: "Invalid Token or Student does not Exists",
            });
    let [error, data] = await to(
        db.execQuery(`SELECT * FROM students WHERE id = ?`, req.params.id)
    );
    if (error) {
        return res.status(500).send({ data: null, error });
    }
    if (data.length === 0)
        return res
            .status(404)
            .send({ data: null, error: `No student with ID:${req.params.id}` });
    res.status(200).send({ data, error: null });
});

// Login
router.post("/login", async (req, res) => {
    let email = req.body.email.trim().toString(),
        password = req.body.password.trim().toString();

    if (
        !email ||
        !password ||
        !emailValidator.validate(email) ||
        password.length <= 5
    )
        return res.status(400).send({ data: null, error: `Invalid Form Data` });

    let [error, data] = await to(
        db.execQuery(
            `SELECT id FROM students WHERE email='${email}' AND password='${password}'`
        )
    );
    if (error) return res.status(500).send({ data: null, error });

    if (data.length == 0)
        return res
            .status(404)
            .send({ data: null, error: "Invalid Email or Password" });

    const token = jwt.sign({ id: data[0].id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

    res.status(200).send({ data: { token }, error: null });
});

// Signup
router.post("/signup", async (req, res) => {
    let username, email, password;
    try {
        (username = req.body.username.trim().toString()),
            (email = req.body.email.trim().toString()),
            (password = req.body.password.trim().toString());
    } catch (e) {
        return res.status(400).send({ data: null, error: `Invalid Form Data` });
    }

    if (
        !username ||
        !email ||
        !password ||
        !emailValidator.validate(email) ||
        password.length < 6
    )
        return res.status(400).send({ data: null, error: `Invalid Form Data` });

    let student = {
        ...req.body,
    };

    let [error, data] = await to(
        db.execQuery("INSERT INTO students SET ?", student)
    );
    if (error) {
        return res.status(400).send({ data: null, error });
    }

    const token = jwt.sign({ id: data.insertId }, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

    res.status(201).send({
        data: { text: `Student Created with ID: ${data.insertId}`, token },
        error: null,
    });
});

module.exports = router;
