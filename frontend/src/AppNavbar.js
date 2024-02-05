import React, { useState, useEffect } from 'react';
import { Navbar, NavbarBrand, NavLink, NavItem, Nav, NavbarText, NavbarToggler, Collapse } from 'reactstrap';
import { Link } from 'react-router-dom';
import tokenService from './services/token.service';
import jwt_decode from "jwt-decode";

function AppNavbar() {
    const [roles, setRoles] = useState([]);
    const [username, setUsername] = useState("");
    const jwt = tokenService.getLocalAccessToken();
    const [collapsed, setCollapsed] = useState(true);

    const toggleNavbar = () => setCollapsed(!collapsed);

    useEffect(() => {
        if (jwt) {
            setRoles(jwt_decode(jwt).authorities);
            setUsername(jwt_decode(jwt).sub);
        }
    }, [jwt])

    let adminLinks = <></>;
    let userLinks = <></>;
    let userLogout = <></>;
    let publicLinks = <></>;

    roles.forEach((role) => {
        if (role === "ADMIN") {
            adminLinks = (
                <>
                    <NavItem>
                        <NavLink style={{ color: "white" }} tag={Link} to="/swagger">Swagger</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink style={{ color: "white" }} tag={Link} to="/users">Users</NavLink>
                    </NavItem>
                </>
            )
        }
    })

    if (!jwt) {
        publicLinks = (
            <>
                <NavItem>
                    <NavLink style={{ color: "white" }} tag={Link} to="/papers">Papers</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="faq" tag={Link} to="/faq">FAQ</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="suppor" tag={Link} to="/support">Support</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="about" tag={Link} to="/about">About Us</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="register" tag={Link} to="/register">Register</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="login" tag={Link} to="/login">Login</NavLink>
                </NavItem>
            </>
        )
    } else {
        userLinks = (
            <>
                <NavItem>
                    <NavLink style={{ color: "white" }} tag={Link} to="/myPapers">My Papers</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} tag={Link} to="/myProfile">My Profile</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} tag={Link} to="/groups">Groups</NavLink>
                </NavItem>
            </>
        )
        userLogout = (
            <>
                <NavItem>
                    <NavLink style={{ color: "white" }} tag={Link} to="/papers">Papers</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="faq" tag={Link} to="/faq">FAQ</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="suppor" tag={Link} to="/support">Support</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink style={{ color: "white" }} id="about" tag={Link} to="/about">About Us</NavLink>
                </NavItem>
                <NavItem></NavItem>
                {/* <NavbarText style={{ color: "white" }} className="justify-content-end">Welcome {username}</NavbarText> */}
                <NavItem className="d-flex">
                    <NavLink style={{ color: "white" }} id="logout" tag={Link} to="/logout">Logout</NavLink>
                </NavItem>
            </>
        )

    }

    return (
        <div>
            <Navbar expand="md" dark color="dark">
                <NavbarBrand href="/">
                    <img alt="logo" src="/Logo1.png" style={{ height: 60, width: 150 }} />

                </NavbarBrand>
                <NavbarToggler onClick={toggleNavbar} className="ms-2" />
                <Collapse isOpen={!collapsed} navbar>
                    <Nav className="me-auto mb-2 mb-lg-0" navbar>
                        {userLinks}
                        {adminLinks}
                    </Nav>
                    <Nav className="ms-auto mb-2 mb-lg-0" navbar>
                        {publicLinks}
                        {userLogout}
                    </Nav>
                </Collapse>
            </Navbar>
        </div>
    );
}

export default AppNavbar;