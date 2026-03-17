// Type guards для обработки ошибок

// Проверка, что ошибка является Error объектом
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

// Проверка MongoDB duplicate key error (код 11000)
export const isMongoDuplicateError = (error: unknown): error is { code: number } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
};

// Проверка Mongoose ValidationError
export const isMongooseValidationError = (error: unknown): error is Error & { name: string; message: string } => {
  return (
    isError(error) &&
    error.name === 'ValidationError' &&
    typeof error.message === 'string'
  );
};

// Получение сообщения об ошибке безопасным способом
export const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Неизвестная ошибка';
};

// Форматирование ошибок Zod валидации
export const formatZodError = (error: unknown): { field: string; message: string }[] => {
  // Проверяем, что это ZodError (имеет свойство issues)
  if (
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray(error.issues)
  ) {
    return error.issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  return [];
};
