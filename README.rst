1pass4all
=========

1pass4all is a bookmarklet to create passwords easily and securely.
Inspired by SuperGenPass, it offers some improvements: 

1. result password is 94-base instead of 64-base.
 
2. based on algorithm HMAC-SHA224 instead of MD5.

3. auto-sumbit when possible.
 
4. takes username into account.

5. provides advanced features like hash iteration and salt.

6. provides special password syntax to take advantage of advanced features
   (e.g. auto-detect username, customize password length, hash iteration, salt)
   without popping up a new form.

7. can work with gmail's password change.

8. won't wrongly autofill all passwords(e.g. password change in yahoo mail)

Installation
------------

After ``make``, open the install.html under ``build`` directory, then follow
its instruction.

Reference
---------

- `SuperGenPass <http://supergenpass.com>`_

- `Wikipedia: SHA-2 <http://en.wikipedia.org/wiki/SHA-2>`_

- `Wikipedia: HMAC <http://en.wikipedia.org/wiki/HMAC>`_

- `Effective TLD <http://mxr.mozilla.org/mozilla/source/netwerk/dns/src/effective_tld_names.dat?raw=1>`_
