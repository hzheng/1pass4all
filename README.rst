1pass4all
=========

Introduction
------------

*1pass4all* is a bookmarklet to create passwords easily and securely.
With the aid of it, a user can log on different websites with different passwords,
while keeping only one master password (which is the ``1`` in ``1pass4all``) in mind.
The best part is that one compromised passowrd will hardly impact other ones.
Inspired by SuperGenPass, it offers some improvements as follows:

- security:

  1pass4all is based on algorithm HMAC-SHA224, which is more secure than MD5.
  Besides, the result password is 94-base instead of 64-base, and 
  password's maximal length is 26 instead of 24.
  What's more, it supports customized salt and hash iteration.  

  Unlike SuperGenPass, 1pass4all takes username into account,
  which means the same master password on the same website will generate
  different passwords as long as usernames differ.

- usability:
 
  When possible, 1pass4all will auto-login after generating password
  without popping up a confirmation form.

  It seems that SuperGenPass doesn't work well on password-change page.
  For example, it wrongly autofills all passwords in yahoo mail, and
  cannot even work in gmail.

- functionality:

  To eliminate popup forms, 1pass4all provides a specialized password syntax
  to utilize advanced features
  (e.g. username auto-detection, password-length/hash-iteration/salt customization).

Installation
------------

After ``make``, open the install.html under ``build`` directory, then 
follow the instructions there. 
Or, simple check the ``install`` part on `project page <http://hzheng.github.com/1pass4all/>`_.


.. warning:: For security reason, each run of ``make`` generates different
             random salts even on the same machine, which means the result
             bookmarklets are *NOT* compatible. 
             To keep the bookmarklets compatible, you should make sure
             they come from the same version and the salts are exactly the same.
 
Usage
-----

After a master password is typed into a password field on a login page,
one click on the 1pass4all bookmarklet will
create an actual password and log the user in(assume the password is correct).
If the user would like the username to be taken into account,
he can enter the username followed by a space before the master password, or,
even simpler, he can just insert a single space before the master password
(the only risk is 1pass4all might guess the wrong username). 
More generally, the password syntax is(bracketed terms are optional): ::

    [user ]master_password[ pass_len][ *hash_iteration][ +salt]

where ``master_password``'s length is at least 6, 
generated password's length ``pass_len`` is less than 100, 
``hash_iteration`` is a positive integer.

.. note:: In a password-change or sign-up page with multiple password fields,
          ``1pass4all`` will disable username auto-detection and form auto-submit.

Disclaimer 
----------

This software is free to use at your own risk.
It has been tested(but not fully) in latest browsers including 
Firefox, Chrome, IE, Safari and Opera, and you're welcome to report any bug
or suggestion to xyzdll [AT] gmail [DOT] com.


Reference
---------

- `SuperGenPass <http://supergenpass.com>`_

- `Wikipedia: SHA-2 <http://en.wikipedia.org/wiki/SHA-2>`_

- `Wikipedia: HMAC <http://en.wikipedia.org/wiki/HMAC>`_

- `Effective TLD <http://mxr.mozilla.org/mozilla/source/netwerk/dns/src/effective_tld_names.dat?raw=1>`_
