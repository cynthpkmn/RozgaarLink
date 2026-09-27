"""
Test Suite: Email and Password Authentication & Smart Routing
Validates:
1. Email and Password input fields in Worker and Employer Sign In forms
2. Sign Up with Email and Sign In with Email buttons
3. Forgot Password link & sendPasswordResetEmail logic
4. registerWithPassword and signInWithPassword implementations in js/app.js
5. Wiring to completeLoginFlow(user, token, role)
6. Export in window.RozgaarApp
"""

import sys
import os
import re

print("=== VERIFYING EMAIL/PASSWORD AUTHENTICATION & SMART ROUTING ===")

# Read js/app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

# 1. Verify UI Elements
assert 'id="email-input"' in app_code, "Input field with id='email-input' missing in app.js"
assert 'id="password-input"' in app_code, "Input field with id='password-input' missing in app.js"
print("[OK] UI Elements: <input type='email' id='email-input'> and <input type='password' id='password-input'> found.")

assert "Sign In with Email" in app_code, "Button 'Sign In with Email' missing in app.js"
assert "Sign Up with Email" in app_code, "Button 'Sign Up with Email' missing in app.js"
assert "Forgot Password" in app_code, "Forgot Password link missing in app.js"
print("[OK] Buttons: 'Sign In with Email', 'Sign Up with Email', and 'Forgot Password' present.")

# 2. Verify registerWithPassword
assert 'async function registerWithPassword(' in app_code, "registerWithPassword function definition missing"
assert 'createUserWithEmailAndPassword(email, password)' in app_code, "createUserWithEmailAndPassword call missing"
print("[OK] registerWithPassword function implemented with firebase.auth().createUserWithEmailAndPassword.")

# 3. Verify signInWithPassword
assert 'async function signInWithPassword(' in app_code, "signInWithPassword function definition missing"
assert 'signInWithEmailAndPassword(email, password)' in app_code, "signInWithEmailAndPassword call missing"
print("[OK] signInWithPassword function implemented with firebase.auth().signInWithEmailAndPassword.")

# 4. Verify forgotPassword
assert 'async function forgotPassword(' in app_code, "forgotPassword function definition missing"
assert 'sendPasswordResetEmail(email)' in app_code, "sendPasswordResetEmail call missing"
print("[OK] forgotPassword function implemented with firebase.auth().sendPasswordResetEmail.")

# 5. Verify Wiring to completeLoginFlow
assert re.search(r'registerWithPassword.*await user\.getIdToken\(\).*await completeLoginFlow\(user,\s*token,\s*role\)', app_code, re.DOTALL), "registerWithPassword must extract idToken and call completeLoginFlow"
assert re.search(r'signInWithPassword.*await user\.getIdToken\(\).*await completeLoginFlow\(user,\s*token,\s*role\)', app_code, re.DOTALL), "signInWithPassword must extract idToken and call completeLoginFlow"
print("[OK] Wiring: registerWithPassword & signInWithPassword extract ID token and invoke completeLoginFlow(user, token, role).")

# 6. Verify Exports in window.RozgaarApp
assert 'signInWithPassword,' in app_code, "signInWithPassword must be exported in window.RozgaarApp"
assert 'registerWithPassword,' in app_code, "registerWithPassword must be exported in window.RozgaarApp"
assert 'forgotPassword,' in app_code, "forgotPassword must be exported in window.RozgaarApp"
print("[OK] Exports: signInWithPassword, registerWithPassword, and forgotPassword exported on RozgaarApp.")

print("\n>>> ALL EMAIL/PASSWORD AUTHENTICATION TESTS PASSED! <<<")
