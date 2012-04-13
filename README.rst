1pass4all
=========

Introduction
------------

*1pass4all* is a bookmarklet to create passwords easily and securely.
With the aid of it, a user can log on different websites with different passwords,
while keeping only one master password (which is the ``1`` in ``1pass4all``) in mind.
The best part is that one compromised password will hardly impact other ones.
Inspired by SuperGenPass, it offers some improvements. Please refer to the
`this article`_ for more details.

Installation
------------

After ``make``, open the install.html under ``build/dist`` directory, then 
follow the instructions there. Or, simply check the
`installation page <http://en.zhenghui.org/1pass4all/archive/install.html>`_.
 
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

    [user ]master_password[ pass_len][ @domain][ *hash_iteration][ +salt][ -options]

where ``master_password``'s length is at least 6, 
generated password's length ``pass_len`` is less than 100, 
``hash_iteration`` indicates the hash iteration times(0-9999),
``salt`` is a `cryptographic salt <http://en.wikipedia.org/wiki/Salt_(cryptography)>`_,
and ``options`` are extra options::

    p - prompt(i.e. disable auto-submit)
    A - any printable password(default)
    a - alphanumeric password
    n - numeric password
    6 - base64 password(alphanum plus + and /)

1pass4all will pop up a form(and therefore disable auto-submit)
in one of the following cases:

- In a page (typically for password-change or sign-up) with multiple password fields.
  In this case, clicking on the bookmarklet will take effect on the focused
  (or the first) password field. In addition, username auto-detection is disabled.

- Password contains a prompt option(refer to the above password syntax).

- A page with no password fields.
 
- A page does have password field, but fails to be detected for some reason.

- Auto-login is disabled by customization.

- Some unexpected error happened.

*NOTE:*

User name and domain are all case-insensitive. Internally, TLD will be stripped
of domains, such that user can share password between yahoo.com and yahoo.com.cn,
google.com and google.cn, box.com and box.net, etc.

Troubleshooting 
---------------

- 1pass4all cannot auto-login
  
  If that is the case, please append the master password with " -p"
  (i.e. space, dash and letter ``p``) to disable auto-login and pop up
  a form.

- 1pass4all cannot transform master password in-place

  If 1pass4all fails to find the right place of password fields, you have to
  type a master password in a pop-up form and manually copy or type the generated
  password into password fields.

- website complains that the generated password has illegal characters

  Some websites disallow special characters in password. If that is the case,
  please append the master password with " -a"(i.e. space, dash and letter ``a``)
  to exclude special characters.

- website complains that the generated password is too long

  Please append the master password with space and a number which specifies
  the length of generated password(DON'T manually truncate the result password).

Feedback 
--------

This software has been tested(but not fully) in latest browsers including 
Firefox, Chrome, IE, Safari and Opera, and you're welcome to report any bug
or suggestion to xyzdll [AT] gmail [DOT] com, or leave your comment `here`_.


Reference
---------

- `SuperGenPass <http://supergenpass.com>`_

- `Wikipedia: SHA-2 <http://en.wikipedia.org/wiki/SHA-2>`_

- `Wikipedia: HMAC <http://en.wikipedia.org/wiki/HMAC>`_

- `Effective TLD <http://mxr.mozilla.org/mozilla/source/netwerk/dns/src/effective_tld_names.dat?raw=1>`_

.. _`this article`:
    http://en.zhenghui.org/2012/02/21/one-pass-for-all-intro/

.. _`here`:
    http://en.zhenghui.org/2012/02/21/one-pass-for-all-intro/#disqus_thread

License
-------

Copyright 2012 Hui Zheng

Released under the `MIT License <http://www.opensource.org/licenses/mit-license.php>`_.

