using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;
using UnityEngine.SceneManagement;

public class ButtomManager : MonoBehaviour
{
    //[SerializeField] private string level;

    public void ButtonMoveScene(string level)
    {
        SceneManager.LoadScene(level); // A button that is changing a scene with a provided scene as input.
    }

    string AnalyzeScene = "LoadingScreen"; // The LoadingScreen scene (the one before showing the final predict result)
    string viewProfileScene = "InputUsername";
    string MainScene = "MainMenu"; // The MainMenu scene
    string helpScene = "Help";

    public void HelpButton()
    {
        SceneManager.LoadScene(helpScene); // Changing the scene to the help scene
    }
    public void AnalyzeButton()
    {
        SceneManager.LoadScene(AnalyzeScene);  //Changing the scene to the waiting for response scene
    }

    public void ViewProfileScene()
    {
        SceneManager.LoadScene(viewProfileScene); // Changing to scene to the look for an instagram profile scene
    }

    public void CloseButton()
    {
        SceneManager.LoadScene(MainScene); // Chagning the scene to the main menu. X button used in multiple scenes to return to MainMenue
    }
}
