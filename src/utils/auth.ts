
export const validateRole = (roleValue: string): 'admin' | 'user' => {
  if (roleValue === 'admin') return 'admin';
  return 'user'; // Default to 'user' for any other value
};
