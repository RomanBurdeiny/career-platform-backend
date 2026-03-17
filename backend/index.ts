import dotenv from 'dotenv';
import connectDB from './src/db/connection';
import app from './src/app';

dotenv.config();
connectDB();

const PORT = process.env.PORT || '3000';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
