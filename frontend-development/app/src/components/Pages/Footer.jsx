import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import gh_logo from './images/ghill_log.png';
import '../../components/Styles/Footer.css';

const Footer = () => {
  return (
    <div className="footer-container">
      <Container fluid>
        <Row className="align-items-center">
          <Col md={4} className="footer-section footer-logo-section">
            <img src={gh_logo} alt="GreenHill Logo" className="footer-logo"/>
            <p>Get your finances on!</p>
          </Col>
          <Col md={2} className="footer-section">
            <h5>Resources</h5>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/faq">FAQ</a></li>
            </ul>
          </Col>
          <Col md={2} className="footer-section">
            <h5>Legal</h5>
            <ul>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </Col>
          <Col md={2} className="footer-section">
            <h5>Contact Us</h5>
            <p>Placeholder for address</p>
          </Col>
          <Col md={2} className="footer-section">
            <h5>Report an issue</h5>
            <input type="text" placeholder="Submit an issue" className="issue-input" />
            <button className="submit-button">Submit</button>
          </Col>
        </Row>
        <Row>
          <Col>
            <p className="copyright">@Copyright 2023 GreenHill Game Title</p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Footer;
