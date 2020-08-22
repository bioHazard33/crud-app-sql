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
    if (req.id !== parseInt(process.env.ADMIN_ID) && req.id !== parseInt(req.params.id))
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

router.put('/:id' , auth ,async (req,res)=>{
    let studentId=parseInt(req.params.id)
    if(req.id!==studentId){
        return res.status(400).send({data:null,error:'Invalid token or Student Does not exists'})
    }

    let validUpdates=['username','password'];
    if(req.body.password){
        req.body.password=parseInt(req.body.password);
        if(req.body.password.length<=5)  return res.status(400).send({data:null,error:'Invalid Form data'});
    }
    const keys=Object.keys(req.body)

    keys.forEach(element => {
        if(validUpdates.indexOf(element)===-1)   return res.status(400).send({data:null,error:'Not a valid update'})
    });

    let [error, data] = await to(
        db.execQuery(`SELECT * FROM students WHERE id=${studentId}`)
    );
    if (error) return res.status(500).send({ data: null, error });

    let result=data[0];

    keys.forEach(element=>{
        result[element]=req.body[element]
    })

    let [err, d]=await to(db.execQuery(`UPDATE students SET username = ? , password = ? WHERE id=${studentId}`,[result['username'],result['password']]))
    if (err) return res.status(500).send({ data: null, error:err });

    res.send({data:result,error:null})
})

router.delete('/:id',auth,async(req,res)=>{
    let studentId=parseInt(req.params.id)
    if(req.id!==studentId){
        return res.status(400).send({data:null,error:'Invalid token or Student Does not exists'})
    }

    let [error,data] = await to(db.execQuery(`DELETE FROM students WHERE id=${studentId}`))
    if (error) return res.status(500).send({ data: null, error });
    
    [error,data] = await to(db.execQuery(`SELECT courseId FROM enrolled_data WHERE studentId=${studentId}`))
    if (error) return res.status(500).send({ data: null, error });
    
    let coursesEnrolled=[];
    data.forEach(element=>{
        coursesEnrolled.push(element.courseId)
    })

    let [err,d] = await to(db.execQuery(`DELETE FROM enrolled_data WHERE studentId=${studentId}`))
    if (err) return res.status(500).send({ data: null, error:err });

    [error,data] = await to(db.execQuery(`UPDATE courses SET availableSlots=availableSlots + 1 WHERE id in (${coursesEnrolled})`))
    if (error) return res.status(500).send({ data: null, error });

    res.status(200).send({data:'Success',error:null})
})

module.exports = router;