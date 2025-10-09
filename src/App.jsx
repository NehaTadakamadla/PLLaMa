import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Chatbot from "./pages/Chatbot";
import Login from "./pages/Login";
import SignIn from "./pages/SignIn";
import Layout from "./Layout";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout currentPageName="Landing">
            <Landing />
          </Layout>
        }
      />
      <Route
        path="/signin"
        element={
          <Layout currentPageName="SignIn">
            <SignIn />
          </Layout>
        }
      />
      <Route
        path="/login"
        element={
          <Layout currentPageName="Login">
            <Login />
          </Layout>
        }
      />
      <Route
        path="/chatbot"
        element={
          <Layout currentPageName="Chatbot">
            <Chatbot />
          </Layout>
        }
      />
    </Routes>
  );
}
