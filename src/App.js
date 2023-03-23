import React, { useEffect, useState } from 'react';
import { Panel } from 'primereact/panel';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Galleria } from 'primereact/galleria';
import { Message } from 'primereact/message';
import rake from 'rake-js'
import axios from 'axios';
import { saveAs } from 'file-saver'

export default function App() {
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

  const downloadImage = (imageUrl) => {
    saveAs(imageUrl, 'image.jpg')
  }

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  const [device, setDevice] = useState()

  useEffect(() => {
    if (windowSize) {
      if (windowSize[0] >= (550)) {
        setDevice("desktop")
      } else {
        setDevice("mobile")
      }
    }
  }, [windowSize])

  const languages = [
    { name: "English" },
    { name: "German" },
    { name: "Italian" },
    { name: "Dutch" },
    { name: "Portuguese" },
    { name: "Spanish" },
    { name: "Swedish" },
  ]

  const [stage, setStage] = useState(1)
  const [article, setArticle] = useState("")
  const [language, setLanguage] = useState(languages[0])
  const [error, setError] = useState(false)
  const [images, setImages] = useState()
  const [activeIndex, setActiveIndex] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (article) {
      setError(false)
      setMessage("")
    }
  }, [article])

  const generate = async () => {
    if (article) {
      const keywords = await rake(article, { language: language.name.toLowerCase() })
      if (keywords) {
        const bestKeywords = keywords.filter((_, index) => index < 10)
        const firstSection = [bestKeywords[0], bestKeywords[1], bestKeywords[2], bestKeywords[3], bestKeywords[4]]
        const secondSection = [bestKeywords[5], bestKeywords[6], bestKeywords[7], bestKeywords[8], bestKeywords[9]]
        let images = []
        const imagesFromFirstSection = []
        const imagesFromSecondSection = []
        await Promise.all(firstSection.map(async (keyword) => {
          await axios.get("https://api.unsplash.com/search/photos", {
            headers: {
              Authorization: `Client-ID ${process.env.REACT_APP_UNSPLASH_API_KEY}`
            },
            params: {
              query: keyword,
              per_page: 3,
              content_filter: "high",
            }
          }).then((response) => {
            response.data.results.map((result) => imagesFromFirstSection.push(result))
          }).catch((error) => {
            if (error) {
              console.clear()
            }
          })
        }))
        await Promise.all(secondSection.map(async (keyword) => {
          await axios.get("https://api.unsplash.com/search/photos", {
            headers: {
              Authorization: `Client-ID ${process.env.REACT_APP_UNSPLASH_API_KEY}`
            },
            params: {
              query: keyword,
              per_page: 2,
              content_filter: "high",
            }
          }).then((response) => {
            response.data.results.map((result) => imagesFromSecondSection.push(result))
          }).catch((error) => {
            if (error) {
              console.clear()
            }
          })
        }))
        if (imagesFromFirstSection.length && imagesFromSecondSection.length) {
          images = [...imagesFromFirstSection, ...imagesFromSecondSection]
          images = images.filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i)
        }
        if (images.length) {
          setImages(images)
          setStage(2)
        } else {
          setError(true)
          setMessage("Something went wrong. Please try again.")
          setArticle("")
        }
      } else {
        setError(true)
        setMessage("Something went wrong. Please try again.")
        setArticle("")
      }
    } else {
      setError(true)
    }
  }

  const reset = () => {
    setArticle("")
    setLanguage(languages[0])
    setError(false)
    setMessage("")
    setImages()
    setActiveIndex(0)
    setStage(1)
  }

  const itemTemplate = (item) => {
    return <img src={item.urls.regular} style={{ width: "100%", maxHeight: "65vh", objectFit: "cover", objectPosition: "center" }} />;
  }

  const onItemChange = (event) => {
    setActiveIndex(event.index)
  }

  const indicatorTemplate = (index) => {
    return <div style={{ width: device == "mobile" ? 9 : 12, height: device == "mobile" ? 9 : 12, borderRadius: "50%", backgroundColor: index == activeIndex ? "#3B82F6" : "#ced4da", cursor: 'pointer' }} />;
  };

  return (
    <div style={{ overflow: "hidden", minHeight: device != "mobile" && "100vh", paddingTop: device == "mobile" && 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      {
        stage == 1 && <div style={{ width: device == "mobile" && "100%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <Panel collapseIcon="pi pi-info-circle" expandIcon="pi pi-info-circle" style={{ width: device == "mobile" ? "100%" : 356, marginBottom: 24 }} header="Article to Images" toggleable collapsed>
            <p style={{ fontSize: 15, color: "gray", fontWeight: "400", letterSpacing: 0.1, lineHeight: 1.25 }}>
              Get image suggestions for your article. Use them as featured image or content material.
            </p>
          </Panel>
          <span style={{ marginBottom: 24 }}>
            <InputTextarea placeholder='Article' className={error && "p-invalid"} cols={100} style={{ width: device == "mobile" ? "100%" : 356, maxHeight: 240 }} id="article" autoResize value={article} onChange={(e) => setArticle(e.target.value)} rows={10} />
          </span>
          {
            message && <Message severity="error" text={message} style={{ marginBottom: 24, maxWidth: device == "mobile" ? "100%" : 356, }} />
          }
          <span style={{ width: "100%", display: "flex", flexDirection: "row" }}>
            <span style={{ flex: 1, marginRight: 24 }}>
              <Dropdown style={{ width: "100%" }} inputId="language" value={language} onChange={(e) => setLanguage(e.value)} options={languages} optionLabel="name" />
            </span>
            <Button onClick={generate} style={{ paddingLeft: 24, paddingRight: 24 }} label="Generate" />
          </span>
        </div>
      }
      {
        (stage == 2 && images) &&
        <div style={{ width: device == "mobile" && "100%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <Galleria indicator={indicatorTemplate} activeIndex={activeIndex} onItemChange={onItemChange} value={images} circular style={{ maxWidth: device == "mobile" ? "100%" : 640, }}
            showItemNavigators showItemNavigatorsOnHover showIndicators
            showThumbnails={false} item={itemTemplate} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", }}>
            <span style={{ display: "flex", flexDirection: "row", fontSize: 14, marginTop: 4 }}>
              <p>Photo by&nbsp;</p>
              <a style={{ color: "#000" }} target="_blank" href={`https://www.unsplash.com/@${images[activeIndex].user.username}`}>
                {images[activeIndex].user.name}
              </a>
              <p>&nbsp;on&nbsp;</p>
              <a style={{ color: "#000" }} target="_blank" href='https://unsplash.com/'>Unsplash</a>
            </span>
            <span>
              <Button size={device == "mobile" && "small"} text onClick={reset} style={{ paddingLeft: 24, paddingRight: 24, marginRight: 12 }} label="Back" />
              <Button size={device == "mobile" && "small"} onClick={() => downloadImage(images[activeIndex].urls.regular)} style={{ paddingLeft: 24, paddingRight: 24, marginTop: 18, }} label="Download" />
            </span>
          </div>
        </div>
      }
    </div>
  )
}