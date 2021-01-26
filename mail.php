<?php
		$name = $_POST['name'];
		$email = $_POST['email'];
		$message = $_POST['message'];

        $to = "cusitian98@gmail.com";

        $subj = "Contact | MS Resume";
        
        $msg ="New message has been received by ".ucwords($name)."\n\nMessage: ".$message."\n\nEmail: ".$email."\n\nRegards,\nMS Resume";
        
        $header = "From: MS Resume <gmerz1998@gmail.com>\r\n";

        $mailSent = mail($to,$subj,$msg,$header);

		if($mailSent)
		{   
            $message = 'Thanks, Your Message Is Sent Successfully.';
        	header('Location: index.php?msg='.$message);
		}
		else
		{
            $message = 'Failed To Sent Email, Try Again';
        	header('Location: index.php?msg='.$message);
		}

?>