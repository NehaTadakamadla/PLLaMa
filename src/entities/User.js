// /**
//  * Mock User entity to simulate authentication
//  */
// export const User = {
//   currentUser: null,

//   // Simulate login redirect
//   loginWithRedirect: (redirectUrl) => {
//     // For demo purposes, just set a mock user
//     User.currentUser = {
//       full_name: "John Doe",
//       email: "john@example.com",
//     };
//     window.location.href = redirectUrl;
//   },

//   // Simulate getting current user
//   me: () => {
//     return new Promise((resolve, reject) => {
//       setTimeout(() => {
//         if (User.currentUser) {
//           resolve(User.currentUser);
//         } else {
//           reject("Not authenticated");
//         }
//       }, 500);
//     });
//   },

//   // Simulate logout
//   logout: () => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         User.currentUser = null;
//         resolve();
//       }, 200);
//     });
//   },
// };
// src/entities/User.js
export class User {
  static async me() {
    const userData = localStorage.getItem('mockUser');
    if (!userData) {
      throw new Error('No authenticated user found');
    }
    return JSON.parse(userData);
  }

  static loginWithRedirect(redirectUrl, email = null, password = null) {
    if (!email || !password) {
      throw new Error('Email and password required');
    }
    if (password.length < 6) {
      throw new Error('Password too short');
    }

    const mockUser = {
      id: Date.now(),
      email: email.toLowerCase(),
      full_name: email.split('@')[0].replace(/\./g, ' ').replace(/^\w/, c => c.toUpperCase()),
    };
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    window.location.href = redirectUrl;
  }

  static async logout() {
    localStorage.removeItem('mockUser');
  }
}
