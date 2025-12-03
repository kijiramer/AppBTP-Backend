// Utilitaire pour gérer le stockage (localStorage pour le web)
class Storage {
  static async getItem(key) {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis le storage:', error);
      return null;
    }
  }

  static async setItem(key, value) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans le storage:', error);
      return false;
    }
  }

  static async removeItem(key) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression du storage:', error);
      return false;
    }
  }

  static async clear() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du nettoyage du storage:', error);
      return false;
    }
  }
}

export default Storage;