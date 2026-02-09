import React from "react";
import { Container, Row, Col, Button, Navbar } from "react-bootstrap";
import { Facebook, Twitter, Instagram, Linkedin } from "react-bootstrap-icons";
import logoEni from "./assets/logo-eni.png";
import { useNavigate } from "react-router-dom";

const Principal = () => {
  const navigate = useNavigate();

  return (
    <div className="principal-page">
      {/* Navbar TOTALMENTE Centrado */}
      <Navbar className="principal-navbar fixed-top py-3">
        <Container className="justify-content-center">
          <div className="d-flex align-items-center gap-3">
            <img src={logoEni} alt="ENI Logo" className="logo-eni" />
            <div className="vr bg-light opacity-25 d-none d-sm-block" style={{height: '30px'}}></div>
            <span className="titulo-principal-navbar d-none d-sm-block">
              Escuela Nacional de Instructores
            </span>
          </div>
        </Container>
      </Navbar>

      {/* Hero Section Centrada Vertical y Horizontalmente */}
      <main className="hero-section d-flex align-items-center">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8} className="fade-in-up">
              <div className="mb-4">
                <span className="badge-plataforma">
                  PLATAFORMA DE GESTIÓN ACADÉMICA
                </span>
              </div>
              
              <h1 className="display-2 fw-bold mb-4 main-title">
                Bienvenido a <br />
                <span className="text-gradient">ENI 360°</span>
              </h1>
              
              <p className="description-text mb-5">
                Herramienta integral para la excelencia del instructor SENA.
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-4">
                <Button 
                  className="btn-ingresar" 
                  onClick={() => navigate("/login")}
                >
                  Entrar al sistema
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </main>

      {/* Footer Centrado */}
      <footer className="principal-footer py-5 text-center">
        <Container>
          <div className="mb-4">
            <img src={logoEni} alt="ENI Logo" width="50" className="mb-2" />
            <h5 className="fw-bold text-white">ENI 360°</h5>
            <p className="small opacity-50">SENA - Colombia 2026</p>
          </div>
          
          <div className="d-flex justify-content-center gap-4 mb-4">
            <a href="#" className="social-link"><Facebook size={20} /></a>
            <a href="#" className="social-link"><Twitter size={20} /></a>
            <a href="#" className="social-link"><Instagram size={20} /></a>
            <a href="#" className="social-link"><Linkedin size={20} /></a>
          </div>

          <div className="small opacity-75">
            <p className="mb-1">Calle 57 No. 8 - 69 Bogotá D.C.</p>
            <p className="mb-0">Línea de atención: +57 601 736 6060</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Principal;