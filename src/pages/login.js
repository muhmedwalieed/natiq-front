// Login/Signup page. Handles login + 3-step signup (personal → password → company).
// Uses react-toastify for feedback. State: isLogin, step, formData, 3 checkboxes.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';
import logo from '../assets/logo.png';
import googleIcon from '../assets/google.png';

const Login = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1);

    // States for Checkboxes (Step 3)
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [isHuman, setIsHuman] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        companyIndustry: '',
        companySize: '',
        companyLocation: ''
    });

    const toggleAuth = () => {
        setIsLogin(!isLogin);
        setStep(1);
        setFormData({
            name: '', phone: '', email: '', password: '', confirmPassword: '',
            companyName: '', companyIndustry: '', companySize: '', companyLocation: ''
        });
        setAcceptedTerms(false);
        setAcceptedPrivacy(false);
        setIsHuman(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone' && value !== '' && !/^\d+$/.test(value)) return;
        if (name === 'phone' && value.length > 11) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleAction = (e) => {
        e.preventDefault();

        if (isLogin) {
            if (!formData.email.includes('@') || formData.password.length < 6) {
                toast.error("Invalid email or password!");
                return;
            }
            toast.success("Welcome back to NATIQ!");
            setTimeout(() => navigate("/dashboard"), 1000);
        } else {
            if (step === 1) {
                if (!formData.name || formData.phone.length !== 11 || !formData.email.includes('@')) {
                    if (formData.phone.length !== 11) {
                        toast.warning("Phone number must be exactly 11 digits");
                    } else {
                        toast.warning("Please complete all details correctly");
                    }
                    return;
                }
                setStep(2);
                toast.info("Step 2: Security settings");
            } else if (step === 2) {
                if (formData.password.length < 6) {
                    toast.error("Password must be at least 6 characters");
                    return;
                }
                if (formData.password !== formData.confirmPassword) {
                    toast.error("Passwords do not match!");
                    return;
                }
                setStep(3);
                toast.info("Step 3: Company Information");
            } else {
                // Final Step (Step 3)
                if (!formData.companyName || !formData.companyIndustry) {
                    toast.warning("Please enter your company details");
                    return;
                }
                toast.success("Account and Company profile created! ");
            }
        }
    };

    return (
        <div className="auth-wrapper">
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            <div className="logo-section">
                <img src={logo} alt="NATIQ Logo" className="main-logo" />
            </div>

            <div className="auth-container">
                <div className="form-header">
                    <h1>{isLogin ? 'Log in' : (step === 3 ? 'Company Information' : 'Sign up')}</h1>
                    <p>
                        {isLogin ? "Log in to your NATIQ account" :
                            (step === 1 ? "Personal Details" :
                                step === 2 ? "Account Security" :
                                    "Set your company information for Natiq to continue")}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleAction}>
                    {/* --- LOGIN VIEW --- */}
                    {isLogin && (
                        <>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="example@mail.com" />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Enter password" />
                            </div>
                        </>
                    )}

                    {/* --- SIGN UP STEP 1 --- */}
                    {!isLogin && step === 1 && (
                        <>
                            <div className="input-group">
                                <label>Full Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full Name" />
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="11-digit mobile number" />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="example@mail.com" />
                            </div>
                        </>
                    )}

                    {/* --- SIGN UP STEP 2 --- */}
                    {!isLogin && step === 2 && (
                        <>
                            <div className="input-group">
                                <label>Create Password</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Min. 6 characters" />
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm Password" />
                            </div>
                        </>
                    )}

                    {/* --- SIGN UP STEP 3 --- */}
                    {!isLogin && step === 3 && (
                        <>
                            <div className="input-group">
                                <label>Enter Company Name</label>
                                <input name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="Company Name" />
                            </div>
                            <div className="input-group">
                                <label>Enter Company Industry</label>
                                <input name="companyIndustry" value={formData.companyIndustry} onChange={handleChange} required placeholder="Company Industry" />
                            </div>
                            <div className="input-group">
                                <label>Enter Company Size</label>
                                <input name="companySize" value={formData.companySize} onChange={handleChange} placeholder="Company Size" />
                            </div>
                            <div className="input-group">
                                <label>Enter Company Location</label>
                                <input name="companyLocation" value={formData.companyLocation} onChange={handleChange} placeholder="Company Location" />
                            </div>

                            <div className="checkbox-section" style={{ textAlign: 'left', margin: '10px 0' }}>
                                <div className="checkbox-item" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ accentColor: '#55711d' }} />
                                    <span>I Accept Terms & Conditions</span>
                                </div>
                                <div className="checkbox-item" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                    <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} style={{ accentColor: '#55711d' }} />
                                    <span>I Accept Privacy Policy</span>
                                </div>
                                <div className="checkbox-item" style={{ fontSize: '10px', display: 'flex', alignItems: 'start', gap: '5px' }}>
                                    <input type="checkbox" checked={isHuman} onChange={(e) => setIsHuman(e.target.checked)} style={{ accentColor: '#55711d', marginTop: '2px' }} />
                                    <span>reCAPTCHA to verify that the user is a human and not a robot</span>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={!isLogin && step === 3 && (!acceptedTerms || !acceptedPrivacy || !isHuman)}
                        style={{ opacity: (!isLogin && step === 3 && (!acceptedTerms || !acceptedPrivacy || !isHuman)) ? 0.5 : 1 }}
                    >
                        {isLogin ? 'Log in' : (step === 3 ? 'Sign UP' : 'Next Step')}
                    </button>

                    {!isLogin && step > 1 && (
                        <p className="back-link" onClick={() => setStep(step - 1)} style={{ cursor: 'pointer', textAlign: 'center', marginTop: '10px', fontSize: '12px', textDecoration: 'underline' }}>
                            ← Back
                        </p>
                    )}
                </form>

                {isLogin && (
                    <>
                        <div className="divider"><span>OR</span></div>
                        <button className="google-btn">
                            <img src={googleIcon} alt="google" /> Continue With Google
                        </button>
                    </>
                )}

                <div className="toggle-text">
                    <p>{isLogin ? "Don't have an account?" : "Already have an account?"}
                        <span onClick={toggleAuth} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#55711d', marginLeft: '5px' }}>
                            {isLogin ? 'Sign up' : 'Log in'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;