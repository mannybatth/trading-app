<script lang="ts">
  import firebase from 'firebase/app';
  import 'firebase/firestore';
  import { FirebaseApp } from 'sveltefire';
  import Nav from '../components/Nav.svelte';
  import { firebaseConfig } from '../firebase-config';
  import './_app.scss';

  export let segment: string;

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
</script>

<FirebaseApp firebase="{firebase}">
  <Nav segment="{segment}" />

  <main>
    <slot />
  </main>
</FirebaseApp>

<style>
  main {
    position: relative;
    max-width: 56em;
    background-color: white;
    padding: 2em;
    margin: 0 auto;
    box-sizing: border-box;
  }
</style>
