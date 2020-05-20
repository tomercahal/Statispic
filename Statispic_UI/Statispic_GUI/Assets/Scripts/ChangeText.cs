using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ChangeText : MonoBehaviour
{

    public Text changingText; // The text that is showing the path to the best image on the screen.

    // Start is called before the first frame update
    void Start()
    {
        ImageChange(); // Loading the image onto the screen from the path given from ML_Client.py
        TextChange(); // Loading the text and adding the best image path.
    }

    public void ImageChange()
    {
        WWW www = new WWW(ImageDir.best_image_dir);
        //while (!www.isDone)
        //    Debug.Log("Loading mofo!");
        GameObject image = GameObject.Find("bestImage"); // Getting the bestImage game object.
        Debug.Log("After while");
        image.GetComponent<RawImage>().texture = www.texture; // Loading the image into the bestImage game object
    }
    public void TextChange()
    {
        Debug.Log("Starting change text");
        Debug.Log("The dir is: " + ImageDir.best_image_dir);
        changingText.text = "The path of the best image is: " + ImageDir.best_image_dir; //ImageDir.best_image_dir containing the path to the image from the server response
        Debug.Log("Finished changing the text");
    }
}
