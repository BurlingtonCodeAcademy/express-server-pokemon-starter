import express from 'express';
import morgan from 'morgan';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const PORT = process.env.PORT || 3000;

const adapter = new JSONFile('./database.json');
const db = new Low(adapter);
await db.read();
db.data ||= { pokemon: [] };

app.get('/', (req, res) => {
  const page = `<h1>Hello Pokemon!</h1>`;
  res.send(page);
});

app.get('/pokemon', (req, res) => {
  res.json(db.data);
});

app.post('/pokemon', (req, res) => {
  const { pokemonName, hitPoints, attack, defense, description } = req.body;
  console.log({ pokemonName, hitPoints, attack, defense, description });
  const newPokemon = {
    name: pokemonName,
    hitPoints,
    attack,
    defense,
    description,
  };
  db.data.unshift(newPokemon);
  db.write();
  res.json({ result: 'success', data: newPokemon });
});

app.get('/pokemon/:id', (req, res) => {
  const pathId = parseInt(req.params.id, 10);
  const result = db.data.find((item) => pathId === item.id);
  res.json(result);
});

app.get('/search', (req, res) => {
  const query = req.query;
  if (Object.keys(query).length === 0) {
    res.json(db.data);
  }
  const queryKeys = Object.keys(req.query);
  const result = db.data.filter((pokemon) => {
    return queryKeys.every((key) => {
      // Description keyword search
      if (key === 'description') {
        return pokemon[key].includes(req.query[key]);
      }

      // String comparisons
      if (typeof pokemon[key] === 'string') {
        return pokemon[key] === req.query[key];
      }

      // Number comparisons
      if (typeof pokemon[key] === 'number') {
        return pokemon[key] === parseInt(req.query[key], 10);
      }

      // Boolean comparisons
      if (typeof pokemon[key] === 'boolean') {
        return pokemon[key] === req.query[key];
      }

      // Array comparisons, i.e. Abilities
      if (typeof pokemon[key] === 'object' && Array.isArray(pokemon[key])) {
        console.log({ key: pokemon[key] });
        return pokemon[key].includes(req.query[key]);
      }

      // Object comparisons, i.e. Evolution
      // /search?evolution=name:venusaur
      if (typeof pokemon[key] === 'object') {
        const [queryKey, queryValue] = req.query[key].split(':');
        return pokemon[key][queryKey] === queryValue;
      }
    });
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}/`);
});
