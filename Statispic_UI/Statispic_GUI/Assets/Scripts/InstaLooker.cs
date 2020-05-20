using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI; //Utilize input and text fields
using System;
using System.Diagnostics;
using System.IO;
using UnityEngine.SceneManagement;



public class InstaLooker : MonoBehaviour
{
    public static void run_cmd(string cmd, string args)
    {
        ProcessStartInfo start = new ProcessStartInfo();
        start.FileName = "C:/Users/tomer/AppData/Local/Programs/Python/Python36/python.exe"; //Where the python.exe is found
        start.Arguments = string.Format("{0} {1}", cmd, args); // Putting all of the cmd line together with args and command
        start.UseShellExecute = false;
        start.RedirectStandardOutput = true;
        start.CreateNoWindow = true;  // For now showing the cmd window
        Process process = Process.Start(start); // Calling the python process
    }
    //Name Input Field
    public InputField nameField; // Getting the inputfield, provided in unity.

    private KeyCode key = KeyCode.Return; // Holding the keypress of enter, so that the user could press the submit button or enter

    public Button button; // Holding the submit button.

    private string username; // Going to be holding the input that the user has typed, once he pressed submit or enter.

    private void Update()
    {
        if (Input.GetKeyDown(key)) // Checking if the user has pressed the enter key
        {
            button.onClick.Invoke(); // Calling the onClick method of the submit button
        }
    }

    public void OnSubmit()
    {
        //string instaLookerScript = "D:/Statispic2/Server_and_client/instaLooker.py"; // Where the instaLooker.py script is located at (not exe version).
        string instaLookerLocal = "./Assets/Python_Scripts/instaLooker.py"; // Where the instaLooker.py script is locally located at (in unity).
        //Set charName string to text in nameField
        username = nameField.text; // Loading the inputfield text from the InputField game object
        nameField.Select();
        nameField.text = ""; // Reseting the InputField text, reset after submit to get ready for another input.
        UnityEngine.Debug.Log("User has entered: " + username);
        UnityEngine.Debug.Log("Calling the python script");
        //run_cmd(instaLookerScript, username); //Calling the python script with the path where it's located and the username to open. Used when not running exe version
        run_cmd(instaLookerLocal, username); //Calling the python script with the path where it's located and the username to open.
        UnityEngine.Debug.Log("After the python script");

    }
}
