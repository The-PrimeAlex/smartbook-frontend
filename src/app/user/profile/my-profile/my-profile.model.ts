export interface OrganizationProfile {
  name: string;
  email: string;
  registrationNumber: string;
}

export interface MyProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organization: OrganizationProfile | null;
}
