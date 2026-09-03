import type { AuthDemoData } from "@/types/auth";

export const authData = {
  login: {
    email: "caro@opendaycare.com",
    passwordPlaceholder: "••••••••",
  },
  activation: {
    kidId: "mateo-fernandez",
    childLabel: "Mateo",
    roomLabel: "Sala Soles",
    invitationCode: "7K4P9",
    email: "lucia.fernandez@gmail.com",
    password: "contraseña",
    consentText:
      "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.",
  },
} satisfies AuthDemoData;
