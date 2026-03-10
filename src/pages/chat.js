// Password creation page (post-signup flow). Validates password match, toggles visibility.
// Uses react-toastify for feedback.
import "../App.css";
import logo from "../assets/logo.png";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateAccount() {
    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        if (pwd !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        toast.success("Account created successfully");
    }

    return (
        <div className="page">
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />

            <img src={logo} alt="NATIQ Logo" className="logo" />

            <div className="card">
                <h1>Create your account</h1>
                <p className="sub">Set your password for Natiq to continue</p>

                <form onSubmit={handleSubmit}>
                    <label>Enter Your Password</label>
                    <div className="passBox">
                        <input
                            type={showPwd ? "text" : "password"}
                            placeholder="Enter your password"
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            required
                        />
                        <span className="eye" onClick={() => setShowPwd(!showPwd)}>👁</span>
                    </div>

                    <label>Confirm your password</label>
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />

                    <button className="continueBtn">Continue</button>
                </form>

                <div className="links">
                    <button className="link-btn">Terms of Use</button>
                    |
                    <button className="link-btn">Privacy Policy</button>
                </div>
            </div>
        </div>
    );
}

export default CreateAccount;
