import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "kerim123",
  port: "5432",
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  try {
    const countriesResult = await db.query(
      "SELECT country_code FROM visited_countries"
    );
    const countries = countriesResult.rows.map((row) => row.country_code);

    const totalResult = await db.query(
      "SELECT COUNT(*) AS count FROM visited_countries"
    );
    const total = totalResult.rows[0].count;

    res.render("index", { countries: countries, total: total, error: null });
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/add", async (req, res) => {
  const { country } = req.body;

  try {
    const countryResult = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) = LOWER($1)",
      [country]
    );

    if (countryResult.rows.length > 0) {
      const countryCode = countryResult.rows[0].country_code;
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } else {
      const countriesResult = await db.query(
        "SELECT country_code FROM visited_countries"
      );
      const countries = countriesResult.rows.map((row) => row.country_code);

      const totalResult = await db.query(
        "SELECT COUNT(*) AS count FROM visited_countries"
      );
      const total = totalResult.rows[0].count;

      res.render("index", {
        countries: countries,
        total: total,
        error: "Country not found in database",
      });
    }
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", async (req, res) => {
  try {
    await db.query("DELETE FROM visited_countries");
    res.redirect("/");
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
