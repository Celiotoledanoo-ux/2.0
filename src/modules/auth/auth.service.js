export const login = async (identifier, password) => {
  if (!identifier || !password) {
    throw new AppError('Por favor, proporciona credenciales de acceso', 400);
  }

  // 1. 🧠 DETECTAR IDENTIDAD
  let finalEmail = identifier.trim().toLowerCase();
  
  // Si NO tiene un "@", asumimos que es un nombre de caja (ej: "Caja 1")
  if (!finalEmail.includes('@')) {
    const normalizedBox = finalEmail.replace(/\s+/g, '');
    finalEmail = `${normalizedBox}@sistema.local`;
  }

  // 2. 🛡️ Intento de Login en Supabase
  const { data, error } = await db.auth.signInWithPassword({
    email: finalEmail,
    password,
  });

  if (error || !data?.user) {
    // Log interno para ti, pero mensaje genérico para el usuario (Seguridad)
    console.error('[AUTH_ERROR]:', error?.message);
    throw new AppError('Credenciales incorrectas o caja no registrada', 401);
  }

  // 3. 🔍 Sincronización con la Tabla Pública
  const userDetails = await authRepo.findById(data.user.id);

  if (!userDetails) {
    throw new AppError('Error de sincronización: Perfil no encontrado en SQL', 404);
  }

  if (!userDetails.active) {
    throw new AppError('Esta cuenta/caja está desactivada.', 403);
  }

  // 4. 📦 Respuesta Maestra
  return {
    user: {
      id: userDetails.id,
      email: userDetails.email,
      role: userDetails.role,
      name: userDetails.name // Usamos el nombre real guardado en SQL
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in
    }
  };
};
