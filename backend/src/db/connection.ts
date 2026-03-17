import mongoose from 'mongoose';

// Подключение к MongoDB
const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI не определена в переменных окружения');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MongoDB connection error:', errorMessage);
    process.exit(1);
  }
};

// Обработка событий подключения
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('MongoDB connection error:', err);
});

export default connectDB;
