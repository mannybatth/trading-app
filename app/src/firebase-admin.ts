import * as firebaseAdmin from 'firebase-admin';

if (typeof window === 'undefined' && !firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: 'tradingapp-88320',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWdmLob4pI0167\noQXvUsw2BjzNcJbvmFFfgRZ7NbaEYNdLTUzuhlbSgmxgRAPIiVYk3av96fNNPhYV\nQx7SvZi1mTuN01sF5QaalFAEF11zg6pKk14+iE1TU/ooPJiGaTV4I7EbcFPfuTpp\nYAk+lsOQDp5tUv0zNvlROEyJp7pMbrzZisA9wQSaI/AZbOtLMan+ZZgX3lVXoN5J\npmWsZbBeYzbGjf0RdZcb4CsNJzVW2OvpHN6zlOtsA+T2GnBzHqcajKznNAqgyQ+H\n1mM32wP1Fu30GGmSSGADjYLeoLjDFUAp1KeZHaP3aTLkHSLG0Rwc0XXD8R11fvsi\nOPIajRrFAgMBAAECggEADj0te3e+Y2/vO/9orLdfWh3nZw944f8HthLUyojqLZdd\nbAE9oJ+YP6FLr0eMxcGCj++M1g60qfX7kt1SPFU8wJ/kIZo9EqLeYaCDwIXJnVwK\nUCnBKd80XRo4A3hkexYcp/WcsnDujK3YaDspWfe6E8Q4thL6vy4A9yjJAiG5/42C\necJNxis3ZZlb4J/rNTzzTNElJavSbb+OzAbDr2r/VFRTI8nZqYWtu1bQFMCieHP2\nYkhHJEYxyhonOw+gq0UyXX3LA1T4iTsjvB8dc7r4u+i+Uc3LxLGySRu/gqvow36E\nTwKQFLw13HJYthU8Kfeo0tbmB38U50edozAUJ3rxKQKBgQD7AWnOOLeSzdHVPJor\nWoc81DSRppPBQlSc/PDeR8g5VyZim1MIEfosoOs+xQ02MtE1SeMGusnWJsTkptV7\nCYZ1wVRxB/Zfq9y8BqWI3cBuad8MnGZPGkt1LueYA/oskDyiNmKtWQ78nBTpFbXn\nvi1OaesV6vkoFtR4kess17csjQKBgQDautPqW7MO4VLx137+w+YRGpMLTqAaHer0\ny9SQ3oW9jPUcw1DgHpmJ3fTaqDkbRdWCKEi/a6Gs1oZF+IcHr7PlPHDRIC3zx+t1\n3ORV3h3K7XyOGtcXP4ZAQQDHbR8pFZMaFqKkcEEZEq/Wwtw8elxr0HrsJIEmV56d\no4PVUbcFGQKBgQC3i1IGZXz/UZf1+Mm3mAw6U+ZY91kmQc3DukacFBt6qpq8El6G\nETdCOS2sicVec4x+DhiADEiZW2Iw3TpQLSfwpb2MpcjoLrFLoQSc76LOWoarHxbF\nEzJIb1MU2xuuSI6+A0zm+6+00qGLy79nxa41n8gzD87AHOmjfPheoyMj5QKBgE0/\n8pwwqrq0pcC4JSgBM/4SbqBtsmnG6zZtzrMjhASABgmUibm91Og2NcYL569UKKYB\naEAC2WTblyybK8VxLo3lnMqfHNueXfCQhSw2eDs1SOo/XHvfeaCz1Hyac4jlD8EF\nAYgmBTe/u86Tn4jUhlOlm+ROuDY8d86g82yhoYvxAoGBANVboHcZZuGoRc1o64E7\naUmr70zvqfFX5uvFqlQ2AbfrIow3J2XWZJ6xrE+g4bR+e5S0s5DCtUAUNkFZRkHt\nJO9Bm6+AY+nXLEg449MNAQXAaIpM1H2bE7NwlEkgH9f+SayEnUb612v/H5mVCSL9\n5PG83Mz/K5TCINz7S6/SCMpu\n-----END PRIVATE KEY-----\n',
      clientEmail: 'firebase-adminsdk-zhyno@tradingapp-88320.iam.gserviceaccount.com',
    }),
    databaseURL: 'https://tradingapp-88320.firebaseio.com',
  });
}

const db = firebaseAdmin.firestore();

export { firebaseAdmin, db };
