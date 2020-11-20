<script lang="ts">
  import firebase from 'firebase/app';
  import 'firebase/firestore';
  import { FirebaseApp } from 'sveltefire';
  import Nav from '../components/Nav.svelte';
  import Notifications from '../components/Notifications.svelte';
  import { firebaseConfig } from '../firebase-config';
  import '../styles/_app.scss';

  export let segment: string;

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
</script>

<Notifications />

<FirebaseApp firebase="{firebase}">
  <Nav segment="{segment}" />

  <main>
    <slot />
  </main>
</FirebaseApp>

<style>
  main {
    position: relative;
    max-width: 65em;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>
