1pass4all
=========

A password generator, which is inspired by SuperGenPass.
Improvements(or differences) include: 

1. result password is 94-base instead of 64-base.
 
2. hash algorithm is SHA224 instead of MD5.
   
3. take username into account and auto-detect it when possible.

4. autosumbit when possible.

5. can work with gmail's password change.

6. won't wrongly autofill all passwords(e.g. password change in yahoo mail)

Installation
------------

After ``make``, open the install.html under ``build`` directory, then follow
its instruction.

Reference
---------

- `SuperGenPass <http://supergenpass.com>`_

- `Wikipedia: SHA-2 <http://en.wikipedia.org/wiki/SHA-2>`_

- `Effective TLD <http://mxr.mozilla.org/mozilla/source/netwerk/dns/src/effective_tld_names.dat?raw=1>`_
