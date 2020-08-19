const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const db = require("../lib/mysql/mysql");
const { to } = require("await-to-js");

// Get all courses
router.get("/", async (req, res) => {
    let [error, data] = await to(db.execQuery(`SELECT * FROM courses`));
    if (error) return res.status(500).send({ data: null, error });

    res.status(200).send({ data, error: null });
});

// Get Specific Course
router.get("/:id", (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(courseJSONPath));
        data = data.filter(
            (ele) => ele["courseId"] === parseInt(req.params.id)
        );
        if (!data) throw `No course with ID:${req.params.id}`;
        res.send({ data, error: null });
    } catch (error) {
        res.status(404).send({ data: null, error });
    }

    // let [error,data]=await to(db.execQuery(`SELECT * FROM courses WHERE id=${}`));
    //     if(error) return res.status(500).send({data:null,error})
});

// Add course
router.post("/", async (req, res) => {
    let name, description, availableSlots;
    try {
        (name = req.body.name.trim()),
            (description = req.body.description.trim()),
            (availableSlots = parseInt(req.body.availableSlots));
    } catch (e) {
        return res.status(400).send({ data: null, error: `Invalid Form Data` });
    }

    if (!name || !description || !availableSlots || availableSlots <= 0)
        return res.status(400).send({ data: null, error: `Invalid Form Data` });

    let course = {
        name,
        description,
        availableSlots,
    };

    let [error, data] = await to(
        db.execQuery("INSERT INTO courses SET ?", course)
    );

    if (error) {
        return res.status(400).send({ data: null, error });
    }

    res.status(201).send({
        data: `Course create with ID: ${data.insertId}`,
        error: null,
    });
});

//Enroll in course
router.post("/:id/enroll", auth, async (req, res) => {
    let courseId = parseInt(req.params.id),
        studentId = parseInt(req.body.studentId);

    if (req.id !== studentId)
        return res
            .status(401)
            .send({
                data: null,
                error: "Invalid Token or Student does not Exists",
            });

    let [error, data] = await to(
        db.execQuery(`SELECT * FROM courses WHERE id=${courseId}`)
    );
    if (error) return res.status(500).send({ data: null, error });

    if (data.length == 0)
        return res
            .status(400)
            .send({ data: null, error: `No Course with ID: ${courseId}` });

    let available_slots = data[0].availableSlots;

    [error, data] = await to(
        db.execQuery(
            `SELECT * FROM enrolled_data WHERE studentId=${studentId} AND courseId=${courseId}`
        )
    );
    if (error) return res.status(500).send({ data: null, error });
    if (data.length > 0)
        return res.status(400).send({
            data: null,
            error: `Student with ID: ${studentId} already enrolled in Course with ID: ${courseId}`,
        });

    if (available_slots <= 0)
        return res
            .status(400)
            .send({ data: null, error: `No available Slots` });

    available_slots--;

    [error, data] = await to(
        db.execQuery(
            `UPDATE courses SET availableSlots=${available_slots} WHERE id=${courseId}`
        )
    );
    if (error) return res.status(500).send({ data: null, error });
    [error, data] = await to(
        db.execQuery(`INSERT INTO enrolled_data SET ?`, {
            courseId,
            studentId,
        })
    );
    if (error) res.status(500).send({ data: null, error });

    res.status(201).send({ data: "Success", error: null });
});

//Deregister from a Course
router.put("/:id/deregister", auth, async (req, res) => {
    let courseId = parseInt(req.params.id),
        studentId = parseInt(req.body.studentId);

    if (req.id !== studentId)
        return res
            .status(401)
            .send({
                data: null,
                error: "Invalid Token or Student does not Exists",
            });

    let [error, data] = await to(
        db.execQuery(`SELECT * FROM courses WHERE id=${courseId}`)
    );
    if (error) return res.status(500).send({ data: null, error });

    if (data.length == 0)
        return res
            .status(400)
            .send({ data: null, error: `No Course with ID: ${courseId}` });

    let available_slots = data[0].availableSlots;

    [error, data] = await to(
        db.execQuery(
            `SELECT * FROM enrolled_data WHERE studentId=${studentId} AND courseId=${courseId}`
        )
    );
    if (error) return res.status(500).send({ data: null, error });
    if (data.length == 0)
        return res.status(400).send({
            data: null,
            error: `Student with ID: ${studentId} not enrolled in Course with ID: ${courseId}`,
        });

    available_slots++;

    [error, data] = await to(
        db.execQuery(
            `UPDATE courses SET availableSlots=${available_slots} WHERE id=${courseId}`
        )
    );
    if (error) return res.status(500).send({ data: null, error });

    [error, data] = await to(
        db.execQuery(
            `DELETE FROM enrolled_data WHERE courseId=${courseId} AND studentId=${studentId}`
        )
    );
    if (error) return res.status(500).send({ data: null, error });

    res.status(201).send({ data: "Success", error: null });
});

module.exports = router;
