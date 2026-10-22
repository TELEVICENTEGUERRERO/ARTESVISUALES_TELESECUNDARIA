<?php
$target_dir = "../imagenes/";
// Si la carpeta no existe, la crea automáticamente
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// Verificar si es una imagen real
if(isset($_POST["submit"])) {
    $check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
    if($check !== false) {
        $uploadOk = 1;
    } else {
        echo "El archivo no es una imagen.";
        $uploadOk = 0;
    }
}

// Intentar subir el archivo
if ($uploadOk == 1) {
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
        // Si todo sale bien, te manda directo a la galería
        header("Location: ../paginas/Galeria.html");
    } else {
        echo "Lo siento, hubo un error al subir tu archivo.";
    }
}
?>