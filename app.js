require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = 3000;


app.use(express.json());

// Connessione unica a MongoDB senza opzioni deprecate
mongoose.connect(process.env.MONGO_URI, {
  auth: {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD
  },
  authSource: "admin"  // Assicurati che sia il database giusto per l'autenticazione
}).then(() => {
  console.log('Connesso al database adventure');
}).catch(err => {
  console.error('Errore di connessione a MongoDB:', err);
});


// Schema per Conversazioni
const conversationSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true, unique: true },  
  chat_id: { type: String, required: true },
  user_id: { type: String, required: true },
  user_name: String,
  adventure_name: { type: String, required: true },
  chosen_genre: String,
  chosen_item: String,
  chosen_location: String,
  character_description: String,
  story_text: { type: String, required: true },
  end_story: { type: String, default: '' }, 
  isCompleted: { type: Boolean, default: false },  
  created_at: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
// story Schema
const storySchema = new mongoose.Schema({
  conversation_id: { type: String, required: true, ref: 'Conversation' },  // ID della conversazione
  story_text: { type: String, required: true },
  end_story: { type: String, default: '' },  // Imposta il valore di default come stringa vuota
  created_at: { type: Date, default: Date.now }
});


const Story = mongoose.model('Story', storySchema);

// Endpoint per salvare una nuova conversazione e una nuova storia
app.post('/api/save-conversation', async (req, res) => {
  try {
    const {
      conversation_id,
      chat_id,
      user_id,
      user_name,
      adventure_name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      story_text,
      end_story,
      isCompleted
    } = req.body;

    if (!conversation_id || !chat_id || !user_id || !adventure_name || !story_text) {
      return res.status(400).json({ message: 'Dati mancanti per il salvataggio della conversazione' });
    }

    // Salva la conversazione nel database
    const newConversation = new Conversation({
      conversation_id,
      chat_id,
      user_id,
      user_name,
      adventure_name,
      chosen_genre,
      chosen_item,
      chosen_location,
      character_description,
      story_text,
      end_story,
      isCompleted
    });

    await newConversation.save();

    // Salva la storia completa nel database
    const newStory = new Story({
      conversation_id,
      story_text: story_text,
      end_story: end_story
      
    });

    await newStory.save();

    res.status(200).json({ message: 'Conversazione e storia salvate con successo', conversation: newConversation, story: newStory });
  } catch (error) {
    console.error('Errore nel salvataggio della conversazione e della storia:', error.message);
    res.status(500).json({ message: 'Errore nel salvataggio della conversazione e della storia', error: error.message });
  }
});

// Endpoint per recuperare tutte le conversazioni incomplete (isCompleted: false)
app.get('/api/get-incomplete-stories', async (req, res) => {
  try {
    const incompleteConversations = await Conversation.find({ isCompleted: false });

    if (incompleteConversations.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia incompleta trovata' });
    }

    res.status(200).json({ incompleteConversations });
  } catch (error) {
    console.error('Errore nel recupero delle storie incomplete:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie incomplete', error: error.message });
  }
});

// Endpoint per recuperare tutte le conversazioni completate (isCompleted: true)
app.get('/api/get-completed-stories', async (req, res) => {
  try {
    const completedConversations = await Conversation.find({ isCompleted: true });

    if (completedConversations.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia completata trovata' });
    }

    res.status(200).json({ completedConversations });
  } catch (error) {
    console.error('Errore nel recupero delle storie completate:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie completate', error: error.message });
  }
});

// Endpoint per il recupero della conversazione
app.get('/api/get-conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find();

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Nessuna conversazione trovata' });
    }

    res.status(200).json({ conversations });
  } catch (error) {
    console.error('Errore nel recupero delle conversazioni:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle conversazioni', error: error.message });
  }
});

// Endpoint per il recupero di tutte le storie
app.get('/api/get-stories', async (req, res) => {
  try {
    const stories = await Story.find();

    if (stories.length === 0) {
      return res.status(404).json({ message: 'Nessuna storia trovata' });
    }

    res.status(200).json({ stories });
  } catch (error) {
    console.error('Errore nel recupero delle storie:', error.message);
    res.status(500).json({ message: 'Errore nel recupero delle storie', error: error.message });
  }
});

// Endpoint per il recupero di una singola storia
app.get('/api/get-story/:storyId', async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: 'Storia non trovata' });
    }

    res.status(200).json({ story });
  } catch (error) {
    console.error('Errore nel recupero della storia:', error.message);
    res.status(500).json({ message: 'Errore nel recupero della storia', error: error.message });
  }
});

// Endpoint per il recupero di una singola conversazione
app.get('/api/get-conversation/:conversationId', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversazione non trovata' });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Errore nel recupero della conversazione:', error.message);
    res.status(500).json({ message: 'Errore nel recupero della conversazione', error: error.message });
  }
});


// Endpoint per aggiornare una conversazione esistente
app.put('/api/update-conversation/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const data = req.body;

  try {
    // Cerca la conversazione in base a conversation_id (non _id) e aggiorna o crea
    const updatedConversation = await Conversation.findOneAndUpdate(
      { conversation_id: conversationId }, // Cerca basato su conversation_id
      data, // I dati da aggiornare
      {
        new: true, // Restituisce il documento aggiornato
        upsert: true, // Crea il documento se non esiste
      }
    );

    if (!updatedConversation) {
      return res.status(404).json({ error: 'Conversazione non trovata' });
    }

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Errore durante l\'aggiornamento della conversazione:', error.message);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento della conversazione.' });
  }
});





// Avvia il server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
