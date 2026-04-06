# Stockage de fichiers

Le projet permet aux utilisateurs d'uploader des fichiers ou des images dans les conversations.

## Vercel Blob

Le stockage permanent des fichiers est géré par le service **Vercel Blob** (`@vercel/blob`).
- Il permet de stocker des objets de manière sécurisée et performante.
- Les URLs générées sont utilisées directement dans les interfaces de chat et stockées dans la base de données.
