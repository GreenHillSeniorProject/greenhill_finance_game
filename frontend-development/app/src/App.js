import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Link, Route, Routes, Navigate } from 'react-router-dom';
import Home from "./components/Pages/Home";
import Welcome from 'components/Pages/Welcome';
import SignUp from 'components/Pages/SignUp';
import SignIn from 'components/Pages/SignIn';
import FAQ from 'components/Pages/Faqs';
import AdminHome from 'components/Pages/AdminHome';
import CreateGame from 'components/Pages/CreateGame';
import ManageGames from 'components/Pages/ManageGames';
import ManageUsers from 'components/Pages/ManageUsers';
import Footer from 'components/Pages/Footer';
import SPStockStats from 'components/Pages/SPStocksStats';
import CurrentGameTable from 'components/Pages/CurrentGameTable';
import Portfolio from 'components/Pages/Portfolio';
import InviteAdvisor from 'components/Pages/InviteAdvisor';
import AdvisorRegistration from 'components/Pages/AdvisorRegistration';
import AdminLogin from 'components/Pages/AdminLogin';
import AdminRegistration from 'components/Pages/AdminRegistration';
import AdminEdit from 'components/Pages/AdminEdit';
import Homepage from 'components/Pages/Homepage';

export default function App() {
  return (
    <div id="app">
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/adminhome" element={<AdminHome />} />
        <Route path="/create-game"  element={<CreateGame />} />
        <Route path="/manage-games"  element={<ManageGames />} />
        <Route path="/manage-users"  element={<ManageUsers />} />
        <Route path='/footer' element={<Footer />} />
        <Route path='/spstockstats' element={<SPStockStats />} />
        <Route path='/cgt' element={<CurrentGameTable />} />
        <Route path='/portfolio' element={<Portfolio />} />
        <Route path='/invite-advisor' element={<InviteAdvisor />} />
        <Route path='/register-advisor' element={<AdvisorRegistration />} />
        <Route path='/inviteadvisor' element={<InviteAdvisor />} />
        <Route path='/admin-login' element={<AdminLogin />} />
        <Route path='/admin-register' element={<AdminRegistration />} />
        <Route path='/admin-edit' element={<AdminEdit />} />
        <Route path='/homepage' element={<Homepage />} />
      </Routes>
    </div>
  );
}
 