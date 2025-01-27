import * as bcrypt from 'bcrypt';

const generateAdminHash = async (): Promise<void> => {
  const password = 'Admin123!';
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Hash du mot de passe admin :', hash);
  } catch (error) {
    console.error('Erreur lors de la génération du hash :', error);
  }
};

generateAdminHash();
