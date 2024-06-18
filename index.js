const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();

const port = 8000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

const notesFile = path.join(__dirname, 'notes.json');

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'UploadForm.html'));
});

const storage = multer.diskStorage({
  destination: './',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/notes', (req, res) => {
  try {
    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, '[]', 'utf8');
    }

    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
    res.json(notes);
  } catch (error) {
    console.error('Помилка отримання списку нотаток:', error);
    res.status(500).json([]);
  }
});

app.get('/notes/:note_name', (req, res) => {
  const note_name = req.params.note_name;

  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');
  }

  if (note_name.trim() === '') {
    alert('Введіть назву нотатки.');
  }

  try {
    const data = fs.readFileSync(notesFile, 'utf8');
    const notes = JSON.parse(data);

    const note = notes.find((note) => note.name === note_name);

    if (note) {
      res.send(note.text);
    } else {
      res.status(404).send('Нотатку не знайдено.');
    }
  } catch (err) {
    res.status(404).send('Не можливо прочитати файл.');
  }
});

app.post('/upload', upload.none(), (req, res) => {
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');
  }
  const note_name = req.body.note_name;
  const note = req.body.note;

  try {
    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, '[]', 'utf8');
    }

    const data = fs.readFileSync(notesFile, 'utf8');
    const notes = JSON.parse(data);

    const existingNote = notes.find((note) => note.name === note_name);

    if (existingNote) {
      res.status(400).send('Нотатка з тим самим ім\'ям вже існує.');
    } else {
      const newNote = { name: note_name, text: note };
      notes.push(newNote);
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
      res.status(201).send('Нотатку створено');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.put('/notes/:note_name', express.text(), (req, res) => {
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');
  }
  const note_name = req.params.note_name;
  const new_text = req.body;

  if (note_name.trim() === '') {
    return res.status(400).send('Введіть назву нотатки.');
  }

  const data = fs.readFileSync(notesFile, 'utf8');
  const notes = JSON.parse(data);
  const noteToUpdate = notes.find((note) => note.name === note_name);

  if (noteToUpdate) {
    noteToUpdate.text = new_text;
    fs.writeFileSync(notesFile, JSON.stringify(notes), 'utf8');
    res.status(200).send('Текст вказаної нотатки успішно оновлено');
  } else {
    res.status(404).send('Не знайдено нотатку');
  }
});

app.delete('/notes/:note_name', (req, res) => {
  if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, '[]', 'utf8');
  }
  const note_name = req.params.note_name;
  try {
    const data = fs.readFileSync(notesFile, 'utf8');
    const notes = JSON.parse(data);

    const noteIndex = notes.findIndex((note) => note.name === note_name);

    if (noteIndex !== -1) {
      notes.splice(noteIndex, 1);
      fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
      res.send('Нотатку успішно видалено.');
    } else {
      res.status(404).send('Нотатку не знайдено.');
    }
  } catch (err) {
    res.status(404).send('Не вдалося прочитати файл.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
