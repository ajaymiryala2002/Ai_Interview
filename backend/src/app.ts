import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import candidateRoutes from './routes/candidates.routes';
import inviteRoutes from './routes/invite.routes';
import sessionRoutes from './routes/sessions.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded candidate images
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/sessions', sessionRoutes);

export default app;
