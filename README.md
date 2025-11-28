# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Executar localmente

Siga estes passos para rodar o projeto localmente (Windows / PowerShell):

1. Instale dependências:

```powershell
npm install
```

2. Crie um arquivo `.env` na raiz do projeto com as variáveis do Supabase (substitua pelos valores do seu projeto):

```text
EXPO_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
```

> Observação: este repositório já inclui um arquivo `.env` de desenvolvimento. Substitua as chaves por suas credenciais reais para que autenticação e chamadas ao Supabase funcionem corretamente.

3. Inicie o servidor de desenvolvimento (Expo):

```powershell
npm run start
# ou rodar direto no web browser
npm run web
```

4. Recomendações:

- Use `npx expo start -c` se encontrar problemas de cache.
- Para testar em um dispositivo Android, instale o `Expo Go` no celular ou configure um emulador Android.

5. Linters e formatação:

```powershell
npm run lint
npm run format
```

Se tiver problemas ao rodar, cole aqui a saída do terminal e eu te ajudo a resolver.
