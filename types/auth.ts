export type LoginDemoData = {
  email: string;
  passwordPlaceholder: string;
};

export type AccountActivationDemoData = {
  kidId: string;
  childLabel: string;
  roomLabel: string;
  invitationCode: string;
  email: string;
  password: string;
  consentText: string;
};

export type AuthDemoData = {
  login: LoginDemoData;
  activation: AccountActivationDemoData;
};
