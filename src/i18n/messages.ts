/**
 * i18n message definitions
 * Provides centralized, translatable strings for user-facing messages
 */

export type Locale = 'en' | 'es' | 'fr';

interface Messages {
  errors: {
    userNotFound: string;
    failedToCreateUser: string;
    failedToFetchUsers: string;
    failedToFetchUser: string;
    failedToUpdateUser: string;
    failedToDeleteUser: string;
    emailRequired: string;
    authenticationFailed: string;
    googleOAuthNotConfigured: string;
    failedToFetchGoogleUserInfo: string;
    unauthorized: string;
    invalidToken: string;
  };
  success: {
    loggedOutSuccessfully: string;
    userCreated: string;
    userUpdated: string;
    userDeleted: string;
  };
  validation: {
    invalidEmail: string;
    nameRequired: string;
    emailRequired: string;
  };
}

const messages: Record<Locale, Messages> = {
  en: {
    errors: {
      userNotFound: 'User not found',
      failedToCreateUser: 'Failed to create user',
      failedToFetchUsers: 'Failed to fetch users',
      failedToFetchUser: 'Failed to fetch user',
      failedToUpdateUser: 'Failed to update user',
      failedToDeleteUser: 'Failed to delete user',
      emailRequired: 'Email is required',
      authenticationFailed: 'Authentication failed',
      googleOAuthNotConfigured:
        'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
      failedToFetchGoogleUserInfo: 'Failed to fetch user info from Google',
      unauthorized: 'Unauthorized',
      invalidToken: 'Invalid token',
    },
    success: {
      loggedOutSuccessfully: 'Logged out successfully',
      userCreated: 'User created successfully',
      userUpdated: 'User updated successfully',
      userDeleted: 'User deleted successfully',
    },
    validation: {
      invalidEmail: 'Invalid email format',
      nameRequired: 'Name is required',
      emailRequired: 'Email is required',
    },
  },
  es: {
    errors: {
      userNotFound: 'Usuario no encontrado',
      failedToCreateUser: 'Error al crear usuario',
      failedToFetchUsers: 'Error al obtener usuarios',
      failedToFetchUser: 'Error al obtener usuario',
      failedToUpdateUser: 'Error al actualizar usuario',
      failedToDeleteUser: 'Error al eliminar usuario',
      emailRequired: 'El correo electrónico es obligatorio',
      authenticationFailed: 'Autenticación fallida',
      googleOAuthNotConfigured:
        'Google OAuth no configurado. Por favor, configure GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET',
      failedToFetchGoogleUserInfo: 'Error al obtener información del usuario de Google',
      unauthorized: 'No autorizado',
      invalidToken: 'Token inválido',
    },
    success: {
      loggedOutSuccessfully: 'Sesión cerrada exitosamente',
      userCreated: 'Usuario creado exitosamente',
      userUpdated: 'Usuario actualizado exitosamente',
      userDeleted: 'Usuario eliminado exitosamente',
    },
    validation: {
      invalidEmail: 'Formato de correo electrónico inválido',
      nameRequired: 'El nombre es obligatorio',
      emailRequired: 'El correo electrónico es obligatorio',
    },
  },
  fr: {
    errors: {
      userNotFound: 'Utilisateur non trouvé',
      failedToCreateUser: "Échec de la création de l'utilisateur",
      failedToFetchUsers: 'Échec de la récupération des utilisateurs',
      failedToFetchUser: "Échec de la récupération de l'utilisateur",
      failedToUpdateUser: "Échec de la mise à jour de l'utilisateur",
      failedToDeleteUser: "Échec de la suppression de l'utilisateur",
      emailRequired: "L'e-mail est requis",
      authenticationFailed: "L'authentification a échoué",
      googleOAuthNotConfigured:
        'Google OAuth non configuré. Veuillez définir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET',
      failedToFetchGoogleUserInfo:
        "Échec de la récupération des informations de l'utilisateur Google",
      unauthorized: 'Non autorisé',
      invalidToken: 'Jeton invalide',
    },
    success: {
      loggedOutSuccessfully: 'Déconnexion réussie',
      userCreated: 'Utilisateur créé avec succès',
      userUpdated: 'Utilisateur mis à jour avec succès',
      userDeleted: 'Utilisateur supprimé avec succès',
    },
    validation: {
      invalidEmail: "Format d'e-mail invalide",
      nameRequired: 'Le nom est requis',
      emailRequired: "L'e-mail est requis",
    },
  },
};

/**
 * Get localized message
 * @param locale - Target locale (defaults to 'en')
 * @returns Messages object for the specified locale
 */
export const getMessages = (locale: Locale = 'en'): Messages => {
  return messages[locale] || messages.en;
};

/**
 * Get locale from request headers
 * @param acceptLanguage - Accept-Language header value
 * @returns Detected locale
 */
export const getLocaleFromHeader = (acceptLanguage?: string): Locale => {
  if (!acceptLanguage) return 'en';

  const preferredLocale = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

  if (preferredLocale === 'es' || preferredLocale === 'fr') {
    return preferredLocale;
  }

  return 'en';
};
