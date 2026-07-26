import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const fallbackServiceAccount = {
  type: "service_account",
  project_id: "epaper-api-key",
  private_key_id: "14ee0d69d43049bbfd8b1e343f82c1e52c7f3df2",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQC1W74awnpejMFU\nFUP89jS/nC3+ii8UvaCnZSNrSpoFUe6MEqIJgHwI3MbAqNJG4DSapCn3HDTwc82p\nYzjebMmTttByGGwNwFH6aE3/Z/Q4tbRRKCqhrGqzpWc8HG0QeYHOnTZtUMCLWIwV\niT7pI0/loxHg9zUTCzw2E6pRsN5fdKt2R1UXpBuMcL9BuxxV1Q//rNR3jJyZEmk8\nnJHVS/+1a5mVyxr4J3fUxkKKiOlVE6N3EKky9prCMAKXFsGAY+ybwxAngYjUbxlJ\ny+3q6THxq9Jt6afL67jnRCh2NR7Ws5K8XvvIHCYaTc1F3/bkZnu/JkmsldH/GBBz\nwK/AKxB1AgMBAAECgf9HbrCc2aeulheP3CXAp+PJlOUzh49ZHAJV7KrcF7DoEjK4\no/OEH+y65jq3/RwrI87pxL9tatlvMYL6tO+GrFK5W8hpKDVnNS5qSFXFw6xDVKPb\n/iDMjUd50CxZVi5Jzud8pMT19FiNNNNNqEFJ6B661FVhG/2hAqE0q4o/ouqeWIBd\nDsoePdCN7OQlb106GzMBNJQ29b2kDhzmnYnyIvlV5FRXp6RLY9q9xU4TAfrg0+fo\nAX+gPafrn6B9Npn7a7Y+4nl2tKm3LW9do+UDJWKMJUwtNqhGf5vz9++DTx30qyuu\nR63NoKrqq0Xpq14Lli8IUPp5AHmesahOm6P5bBECgYEA8UWzjAXu1xnqQhVvAi0k\n3tXPciUfiB6Wy2WF51l3dCl0HMv6ZzObxHwKTI/JGxMVmj7CkQxeyBinC+RN/0ya\nlrVRrmvYCcOSMWlyMzHlpf7aZILb5zUQE/m/gMTmM9zCw9xq3hCJy2o3UGFYGqEI\nkFsTZIQXySjjOpyfey6Yl60CgYEAwG3IShqD7jjKwLGax6iNQjsIVPwBtyG355QT\nbxatZYjsESOPlCksHaUBPQmcjB0+enNYfcsClb5n1q1EFelB3HWkcjKHvyj2whtm\nL4uifDlnnVaA2FA4muVIAXIP9pM9E2H7qmlb19MzM+ejf+WL4jPV720XWBP6lYU2\nftUdlOkCgYBL9L2Jn3SJk0cEdurzrHKnFHiyXq2GlNq0PcniA3BvyX0cc7rpMn4f\nZU14vOt68o8ieA+YymQsalZsj/teHCeuunZ0is8Ag+lKVP/2zgaWM51ddzTznOjq\n4P1A9LvkJ+PI9WNPdbVrrIytaXfrKjcf+wwn4M38LjsbAKPUi97OIQKBgA/8zwhB\nHbb8JvRNjUOLYHkhOHb/HRFfDs2Bwv+Wzb9C2gIuhy5TIWQxImI02znU8CzySmbh\nKAzS7gOrD54WbC9p4sjOI/Mg7yd/aUUH/+78QfyThE70k09jP1FHbcYZw5hJqsQk\nzsmmtXlZhH8Kzk1z6xFiae8acdZcZAOzpyqJAoGAOmJ+uItEj/MvQhf9QWn3ZslY\nA5IHWSgjQFWQ0x4n0XANTXFkdI2Lf2QjkfEX4kvMBXaXZmHfjo7pba1lPVaOE9p9\nioM79KcNF73gPz4gMoVXr5vtOyEqIlF6rJabj27RHz4zsAw/N74PQkwfQjLOmaTt\nc3LC6MH1cDgxVMkiQoQ=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@epaper-api-key.iam.gserviceaccount.com",
  client_id: "107570320592294042288"
};

export function getDb() {
  if (!getApps().length) {
    try {
      let serviceAccount = {};
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      }
      if (!serviceAccount.project_id) {
        serviceAccount = fallbackServiceAccount;
      }
      initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error("Firebase Admin init error:", err);
      try {
        initializeApp({ credential: cert(fallbackServiceAccount) });
      } catch (e) {
        console.error("Fallback init error:", e);
      }
    }
  }
  return getFirestore();
}
